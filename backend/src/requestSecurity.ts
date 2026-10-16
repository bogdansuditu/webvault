import type { Request } from 'express';

// Express handles X-Forwarded-Proto through `trust proxy`. Cloudflare also
// supplies CF-Visitor, which is useful when diagnosing or testing the tunnel.
export function requestUsesHttps(req: Request): boolean {
  if (req.secure) return true;

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  if (forwardedProto === 'https') return true;

  try {
    const visitor = JSON.parse(String(req.headers['cf-visitor'] || '{}'));
    return visitor.scheme === 'https';
  } catch {
    return false;
  }
}
