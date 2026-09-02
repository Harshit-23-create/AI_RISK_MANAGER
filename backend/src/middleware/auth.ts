import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; role: string };
    const user = await User.findById(payload.sub).lean();
    if (!user || !user.isActive) {
      res.status(401).json({ detail: 'User not found or inactive' });
      return;
    }
    req.user = { id: String(user._id), email: user.email, role: user.role };
    next();
  } catch {
    res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ detail: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
