import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { loadConfig } from './config.js';

export interface UserSession {
  username: string;
  verified2fa: boolean;
}

// Extend Express Request interface to include session user info
declare global {
  namespace Express {
    interface Request {
      user?: UserSession;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.webvault_session;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No session cookie found.' });
  }

  const config = loadConfig();

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserSession;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session session.' });
  }
}

// Restricts access to fully 2FA-verified users
export function requireFullAuth(req: Request, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    if (!req.user || !req.user.verified2fa) {
      return res.status(403).json({ error: '2FA verification required to perform this action.' });
    }
    next();
  });
}
