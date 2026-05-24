import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import multer from 'multer';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

import { loadConfig, saveConfig, STORAGE_DIR, CONFIG_DIR } from './config.js';
import { authenticateToken, requireFullAuth, UserSession } from './middleware.js';
import * as fileService from './fileService.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Setup Middleware
app.use(cors({
  origin: true, // In development allow any origin; in Docker we'll serve static assets same-origin
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Configure Multer for streaming uploads directly to disk safely
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadPath = req.query.path ? String(req.query.path) : '';
      const safeDir = fileService.resolveSafePath(uploadPath);
      cb(null, safeDir);
    } catch (err: any) {
      cb(err, '');
    }
  },
  filename: (req, file, cb) => {
    // Keep original filename or sanitize it
    const sanitized = file.originalname.replace(/[\/\\\x00-\x1f\x7f-\x9f]/g, '_');
    cb(null, sanitized);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit per file
});

// Configure Express to trust proxy headers (Cloudflare Tunnels reverse proxy)
app.set('trust proxy', 1);

// Cloudflare-aware Rate Limiter for Authentication Attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each client IP to 5 attempts per window
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Cloudflare Tunnel passes the actual client's IP in CF-Connecting-IP header
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) return String(cfIp);
    
    // Fallback to standard X-Forwarded-For or raw connection IP
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = String(forwarded).split(',');
      return ips[0].trim();
    }
    return req.ip || '127.0.0.1';
  }
});

// Load config at startup
loadConfig();

// ==========================================
// Authentication Routes
// ==========================================

// 1. Password Verification & Phase-1 JWT Setup
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  const config = loadConfig();

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (username !== config.appUser) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const isPasswordValid = await bcrypt.compare(password, config.appPasswordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Check if TOTP is already configured
  const setupRequired = !config.totpSecret;

  // Generate a partial session token (2FA verification pending)
  const partialSession: UserSession = {
    username,
    verified2fa: false
  };

  const tempToken = jwt.sign(partialSession, config.jwtSecret, { expiresIn: '15m' });

  // Set as HttpOnly, SameSite cookie
  res.cookie('webvault_session', tempToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 mins to finish 2FA
  });

  return res.json({
    success: true,
    need_2fa: true,
    setup_required: setupRequired
  });
});

// 2. Setup TOTP 2FA (Returns QR Code) - restricted to Phase-1 Auth
app.get('/api/auth/setup-2fa', authenticateToken, async (req, res) => {
  const config = loadConfig();
  
  if (config.totpSecret) {
    return res.status(400).json({ error: '2FA has already been configured.' });
  }

  // Generate a new secret and store it temporarily in memory on req.user or config (save it on success verify)
  const username = req.user?.username || 'admin';
  const newSecret = authenticator.generateSecret();
  
  // Temporarily store secret in global activeConfig (not saved to file yet)
  config.totpSecret = newSecret; 

  const otpauthUrl = authenticator.keyuri(username, 'WebVault', newSecret);
  
  try {
    const qrDataUrl = await qrcode.toDataURL(otpauthUrl);
    res.json({
      qrCode: qrDataUrl,
      secret: newSecret
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR Code' });
  }
});

// 3. Verify TOTP Code (Phase-2 Auth verification)
app.post('/api/auth/verify-2fa', authLimiter, authenticateToken, async (req, res) => {
  const { code } = req.body;
  const config = loadConfig();

  if (!code) {
    return res.status(400).json({ error: '6-digit verification code is required.' });
  }

  if (!config.totpSecret) {
    return res.status(400).json({ error: '2FA secret not initialized. Request setup-2fa first.' });
  }

  // Validate the code
  const isValid = authenticator.check(code, config.totpSecret);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
  }

  // Successfully verified! Save secret to config file if it wasn't there (completing first setup)
  saveConfig({ totpSecret: config.totpSecret });

  // Generate full session token
  const fullSession: UserSession = {
    username: req.user!.username,
    verified2fa: true
  };

  const fullToken = jwt.sign(fullSession, config.jwtSecret, { expiresIn: '24h' });

  // Set full auth session cookie
  res.cookie('webvault_session', fullToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  return res.json({
    success: true,
    user: req.user!.username
  });
});

// Theme endpoints
app.get('/api/theme', (req, res) => {
  const themePath = path.join(CONFIG_DIR, 'theme.json');
  try {
    if (fs.existsSync(themePath)) {
      const data = fs.readFileSync(themePath, 'utf-8');
      return res.json(JSON.parse(data));
    }
  } catch (err) {
    console.error('Failed to read theme.json:', err);
  }
  // Fallback if not found or errored
  res.json({
    activeTheme: "sonoma",
    themes: {
      sonoma: { 
        name: "macOS Sonoma (Default)", 
        iconSet: "sf-symbols",
        colors: { light: {}, dark: {} } 
      }
    }
  });
});

app.post('/api/theme', (req, res) => {
  const { activeTheme } = req.body;
  if (!activeTheme) {
    return res.status(400).json({ error: 'activeTheme is required' });
  }

  const themePath = path.join(CONFIG_DIR, 'theme.json');
  try {
    let themeData: any = { activeTheme: "sonoma", themes: {} };
    if (fs.existsSync(themePath)) {
      themeData = JSON.parse(fs.readFileSync(themePath, 'utf-8'));
    }
    
    if (!themeData.themes[activeTheme]) {
      return res.status(400).json({ error: `Theme '${activeTheme}' does not exist in configuration.` });
    }

    themeData.activeTheme = activeTheme;
    fs.writeFileSync(themePath, JSON.stringify(themeData, null, 2), 'utf-8');
    res.json({ success: true, activeTheme });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Session Status
app.get('/api/auth/status', (req, res) => {
  const token = req.cookies?.webvault_session;
  if (!token) {
    return res.json({ authenticated: false });
  }

  const config = loadConfig();
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserSession;
    if (decoded.verified2fa) {
      return res.json({ authenticated: true, user: decoded.username, displayName: config.displayName });
    }
    return res.json({ authenticated: false, partial: true });
  } catch (err) {
    return res.json({ authenticated: false });
  }
});

// 5. Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('webvault_session');
  res.json({ success: true });
});

// 6. Update Account Credentials (username, password, display name)
app.post('/api/auth/update-account', requireFullAuth, async (req, res) => {
  const { username, password, displayName } = req.body;
  const config = loadConfig();

  const updates: Partial<any> = {};

  if (username && typeof username === 'string') {
    const trimmed = username.trim();
    if (trimmed.length > 0) {
      updates.appUser = trimmed;
    }
  }

  if (password && typeof password === 'string') {
    if (password.length >= 4) {
      const salt = await bcrypt.genSalt(10);
      updates.appPasswordHash = await bcrypt.hash(password, salt);
    } else {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }
  }

  if (displayName && typeof displayName === 'string') {
    const trimmed = displayName.trim();
    if (trimmed.length > 0) {
      updates.displayName = trimmed;
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid account updates provided.' });
  }

  try {
    saveConfig(updates);
    res.json({
      success: true,
      user: updates.appUser || config.appUser,
      displayName: updates.displayName || config.displayName
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update account details.' });
  }
});


// ==========================================
// File Operations Routes (require fully verified 2FA)
// ==========================================

// List files in path
app.get('/api/files/list', requireFullAuth, async (req, res) => {
  const relativePath = req.query.path ? String(req.query.path) : '';
  try {
    const items = await fileService.listDirectory(relativePath);
    res.json({ success: true, items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Folder
app.post('/api/files/create-folder', requireFullAuth, (req, res) => {
  const { path: parentPath, name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }
  try {
    const newRelative = fileService.createFolder(parentPath || '', name);
    res.json({ success: true, folder: newRelative });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Rename / Move
app.post('/api/files/rename', requireFullAuth, (req, res) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) {
    return res.status(400).json({ error: 'oldPath and newPath are required' });
  }
  try {
    const moved = fileService.renameOrMove(oldPath, newPath);
    res.json({ success: true, file: moved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Move items to Trash
app.post('/api/files/delete', requireFullAuth, (req, res) => {
  const { paths } = req.body;
  if (!paths || !Array.isArray(paths)) {
    return res.status(400).json({ error: 'paths array is required' });
  }
  try {
    const results = paths.map(p => fileService.moveToTrash(p));
    res.json({ success: true, trashed: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Empty Trash folder
app.post('/api/files/empty-trash', requireFullAuth, (req, res) => {
  try {
    fileService.emptyTrash();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Zip Items
app.post('/api/files/compress', requireFullAuth, async (req, res) => {
  const { path: parentPath, items, name } = req.body;
  if (!items || !Array.isArray(items) || !name) {
    return res.status(400).json({ error: 'items array and zip name are required' });
  }
  try {
    const zipPath = await fileService.compressItems(parentPath || '', items, name);
    res.json({ success: true, zip: zipPath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Unzip Item
app.post('/api/files/decompress', requireFullAuth, async (req, res) => {
  const { path: zipPath } = req.body;
  if (!zipPath) {
    return res.status(400).json({ error: 'zip file path is required' });
  }
  try {
    const extractedDir = await fileService.decompressItem(zipPath);
    res.json({ success: true, extracted: extractedDir });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stream Single File Download or Multi-File zip on-the-fly
app.get('/api/files/download', requireFullAuth, async (req, res) => {
  const relativePath = req.query.path ? String(req.query.path) : '';
  const paths = req.query.paths ? JSON.parse(String(req.query.paths)) as string[] : [];

  try {
    if (paths.length > 1) {
      // Multiple items selected -> Compress on the fly and stream directly to client
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="webvault_download.zip"');

      const archive = archiver('zip', { zlib: { level: 5 } });
      archive.on('error', (err: any) => {
        throw err;
      });
      archive.pipe(res);

      for (const p of paths) {
        const safeP = fileService.resolveSafePath(p);
        const name = path.basename(safeP);
        const stat = fs.statSync(safeP);
        if (stat.isDirectory()) {
          archive.directory(safeP, name);
        } else {
          archive.file(safeP, { name });
        }
      }
      archive.finalize();
    } else {
      // Single item download
      const target = relativePath || paths[0];
      const safePath = fileService.resolveSafePath(target);
      const stat = fs.statSync(safePath);

      if (stat.isDirectory()) {
        // If it's a directory, zip and stream
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(safePath)}.zip"`);

        const archive = archiver('zip', { zlib: { level: 5 } });
        archive.pipe(res);
        archive.directory(safePath, path.basename(safePath));
        archive.finalize();
      } else {
        // Single file -> send direct
        res.download(safePath, path.basename(safePath));
      }
    }
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Stream Upload files (handles single & multi-file upload)
app.post('/api/files/upload', requireFullAuth, upload.array('files'), (req, res) => {
  res.json({ success: true, uploaded: req.files });
});


// ==========================================
// Static Assets & Web Client Server
// ==========================================

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve compiled static Vite build files in Production mode
const staticFrontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(staticFrontendPath)) {
  app.use(express.static(staticFrontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticFrontendPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`WebVault Server running on http://localhost:${PORT}`);
  console.log(`Storage path mapped to: ${STORAGE_DIR}`);
});
