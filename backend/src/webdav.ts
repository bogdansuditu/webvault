import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { v2 as webdav } from 'webdav-server';

import { loadConfig, STORAGE_DIR } from './config.js';
import { requestUsesHttps } from './requestSecurity.js';

const DAV_MOUNT_PATH = '/webdav';
const TRASH_DIRECTORY = '.TrashFolder';
const TEMP_UPLOAD_PREFIX = '.webvault-upload-';
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const MAX_AUTH_FAILURES = 5;

interface AuthFailureState {
  count: number;
  resetAt: number;
}

const authFailures = new Map<string, AuthFailureState>();

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function clientKey(req: Request): string {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return String(cfIp);

  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();

  return req.ip || req.socket.remoteAddress || 'unknown';
}

function getFailureState(key: string): AuthFailureState {
  const now = Date.now();
  const existing = authFailures.get(key);
  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + AUTH_WINDOW_MS };
    authFailures.set(key, fresh);
    return fresh;
  }
  return existing;
}

function challenge(res: Response, status = 401, message = 'WebDAV authentication required.'): void {
  res.setHeader('WWW-Authenticate', 'Basic realm="WebVault WebDAV", charset="UTF-8"');
  res.status(status).type('text/plain').send(message);
}

function parseBasicCredentials(header: string | undefined): { username: string; password: string } | null {
  if (!header || !header.startsWith('Basic ')) return null;

  try {
    const decoded = Buffer.from(header.slice(6).trim(), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1)
    };
  } catch {
    return null;
  }
}

function davRelativePath(urlValue: string): string {
  const parsed = new URL(urlValue, 'http://webvault.local');
  let pathname: string;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    throw new Error('Malformed WebDAV path.');
  }

  if (pathname !== DAV_MOUNT_PATH && !pathname.startsWith(`${DAV_MOUNT_PATH}/`)) {
    throw new Error('WebDAV destination is outside the mounted endpoint.');
  }

  return pathname.slice(DAV_MOUNT_PATH.length).replace(/^\/+/, '');
}

function validateDavPath(urlValue: string): string {
  const relative = davRelativePath(urlValue);
  const segments = relative.split('/').filter(Boolean);

  if (segments.includes(TRASH_DIRECTORY)) {
    throw new Error('The application Trash is not available through WebDAV.');
  }
  if (segments.some(segment => segment.startsWith(TEMP_UPLOAD_PREFIX))) {
    throw new Error('Temporary WebDAV upload resources are not accessible.');
  }
  if (segments.some(segment => segment.includes('\0') || segment.includes('\\'))) {
    throw new Error('Invalid WebDAV path.');
  }

  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  const root = fs.realpathSync(STORAGE_DIR);
  const candidate = path.resolve(root, relative);
  if (!isWithin(root, candidate)) {
    throw new Error('WebDAV path escapes the storage root.');
  }

  // Symbolic links are deliberately unavailable through DAV. This prevents a
  // link stored in /app/storage from exposing a container path outside it.
  let cursor = root;
  for (const segment of segments) {
    cursor = path.join(cursor, segment);
    if (!fs.existsSync(cursor)) break;
    const stat = fs.lstatSync(cursor);
    if (stat.isSymbolicLink()) {
      throw new Error('Symbolic links are not available through WebDAV.');
    }
  }

  return candidate;
}

class PhysicalStorageManager implements webdav.IStorageManager {
  private diskUsage(callback: (available: number, used: number) => void): void {
    fs.statfs(STORAGE_DIR, (error, stats) => {
      if (error) {
        console.error('Failed to read WebDAV storage capacity:', error);
        callback(0, 0);
        return;
      }

      const blockSize = Number(stats.bsize);
      const available = Math.max(0, Number(stats.bavail) * blockSize);
      const used = Math.max(0, (Number(stats.blocks) - Number(stats.bfree)) * blockSize);
      callback(available, used);
    });
  }

  reserve(_ctx: webdav.RequestContext, _fs: webdav.FileSystem, size: number, callback: (reserved: boolean) => void): void {
    if (size <= 0) return callback(true);
    this.diskUsage((available) => callback(size <= available));
  }

  evaluateCreate(
    _ctx: webdav.RequestContext,
    _fs: webdav.FileSystem,
    _path: webdav.Path,
    _type: webdav.ResourceType,
    callback: (size: number) => void
  ): void {
    callback(0);
  }

  evaluateContent(
    _ctx: webdav.RequestContext,
    _fs: webdav.FileSystem,
    expectedSize: number,
    callback: (size: number) => void
  ): void {
    callback(Math.max(0, expectedSize));
  }

  evaluateProperty(
    _ctx: webdav.RequestContext,
    _fs: webdav.FileSystem,
    _name: string,
    _value: webdav.ResourcePropertyValue,
    _attributes: webdav.PropertyAttributes,
    callback: (size: number) => void
  ): void {
    callback(0);
  }

  available(_ctx: webdav.RequestContext, _fs: webdav.FileSystem, callback: (available: number) => void): void {
    this.diskUsage((available) => callback(available));
  }

  reserved(_ctx: webdav.RequestContext, _fs: webdav.FileSystem, callback: (reserved: number) => void): void {
    this.diskUsage((_available, used) => callback(used));
  }
}

function expectedUploadLength(req: Request): number | null {
  for (const value of [req.headers['x-expected-entity-length'], req.headers['content-length']]) {
    if (value === undefined) continue;
    const parsed = Number(Array.isArray(value) ? value[0] : value);
    if (Number.isSafeInteger(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

// Finder reserves names with empty files, then sends the content in a chunked
// PUT carrying X-Expected-Entity-Length. Stage each body and rename atomically
// so an interrupted client/tunnel request cannot leave a truncated file behind.
export async function handleWebDavPut(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.method !== 'PUT') return next();

  let destination: string;
  try {
    destination = validateDavPath(req.originalUrl);
  } catch (error: any) {
    res.status(404).type('text/plain').send(error.message || 'WebDAV resource not found.');
    return;
  }

  const parent = path.dirname(destination);
  try {
    const parentStat = await fs.promises.stat(parent);
    if (!parentStat.isDirectory()) throw new Error('Parent is not a directory.');
  } catch {
    res.status(409).type('text/plain').send('The destination parent directory does not exist.');
    return;
  }

  const existed = fs.existsSync(destination);
  const temporary = path.join(parent, `.webvault-upload-${crypto.randomUUID()}.tmp`);
  const expected = expectedUploadLength(req);
  let received = 0;

  const counter = new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length;
      callback(null, chunk);
    }
  });

  try {
    await pipeline(req, counter, fs.createWriteStream(temporary, { flags: 'wx' }));

    if (expected !== null && received !== expected) {
      throw new Error(`Incomplete WebDAV upload: expected ${expected} bytes but received ${received}.`);
    }

    await fs.promises.rename(temporary, destination);
    res.setHeader('Cache-Control', 'no-store');
    res.status(existed ? 204 : 201).end();
  } catch (error: any) {
    await fs.promises.unlink(temporary).catch(() => undefined);
    console.error(`WebDAV PUT failed for ${req.originalUrl}:`, error?.message || error);
    if (!res.headersSent && !res.destroyed) {
      const incomplete = expected !== null && received !== expected;
      res.status(incomplete ? 400 : 500).type('text/plain').send(
        incomplete ? 'The WebDAV upload body was incomplete.' : 'The WebDAV upload could not be stored.'
      );
    }
  }
}

class WebVaultPhysicalFileSystem extends webdav.PhysicalFileSystem {
  protected _readDir(
    davPath: webdav.Path,
    context: webdav.ReadDirInfo,
    callback: webdav.ReturnCallback<string[] | webdav.Path[]>
  ): void {
    super._readDir(davPath, context, (error, entries) => {
      if (error || !entries) return callback(error, entries);

      const directoryPath = this.getRealPath(davPath).realPath;
      const filtered = entries.map(entry => typeof entry === 'string' ? entry : entry.fileName()).filter(name => {
        if (davPath.isRoot() && name === TRASH_DIRECTORY) return false;
        if (name.startsWith(TEMP_UPLOAD_PREFIX)) return false;

        try {
          return !fs.lstatSync(path.join(directoryPath, name)).isSymbolicLink();
        } catch {
          return false;
        }
      });
      callback(undefined, filtered);
    });
  }
}

export async function authenticateWebDav(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (process.env.NODE_ENV === 'production' && !requestUsesHttps(req)) {
    res.status(400).type('text/plain').send('WebDAV Basic authentication requires HTTPS.');
    return;
  }

  const key = clientKey(req);
  const failureState = getFailureState(key);
  if (failureState.count >= MAX_AUTH_FAILURES) {
    const retryAfterSeconds = Math.max(1, Math.ceil((failureState.resetAt - Date.now()) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    challenge(res, 429, 'Too many WebDAV authentication failures. Try again later.');
    return;
  }

  const config = loadConfig();
  const credentials = parseBasicCredentials(req.headers.authorization);
  let authenticated = false;

  try {
    authenticated = !!(
      config.webdavPasswordHash &&
      credentials &&
      credentials.username === config.appUser &&
      await bcrypt.compare(credentials.password, config.webdavPasswordHash)
    );
  } catch (error) {
    console.error('WebDAV authentication failed:', error);
  }

  if (!authenticated) {
    failureState.count += 1;
    challenge(res);
    return;
  }

  authFailures.delete(key);
  // The DAV engine has its own optional Digest authentication mechanism. The
  // credential has already been verified against WebVault's bcrypt hash, so do
  // not pass the Basic header into that separate user database.
  delete req.headers.authorization;

  try {
    validateDavPath(req.originalUrl);
    if (req.headers.destination) {
      validateDavPath(String(req.headers.destination));
    }
  } catch (error: any) {
    res.status(404).type('text/plain').send(error.message || 'WebDAV resource not found.');
    return;
  }

  next();
}

export function createWebDavHandler() {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });

  const server = new webdav.WebDAVServer({
    rootFileSystem: new WebVaultPhysicalFileSystem(STORAGE_DIR),
    storageManager: new PhysicalStorageManager(),
    // Express authenticates against the bcrypt hash before requests reach the
    // DAV engine. Disable its separate in-memory Digest user database.
    requireAuthentification: false,
    strictMode: false,
    serverName: 'WebVault',
    headers: {
      'Cache-Control': 'no-store'
    }
  });

  return webdav.extensions.express(DAV_MOUNT_PATH, server);
}

