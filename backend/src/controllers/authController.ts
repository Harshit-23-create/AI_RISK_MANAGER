import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { config } from '../config/env';
import { HttpError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(6),
  full_name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});

function createToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: body.email });
    if (existing) throw new HttpError(400, 'Email already registered');

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      email: body.email,
      passwordHash,
      fullName: body.full_name,
      role: 'analyst',
    });

    await AuditLog.create({ userId: user._id, action: 'register', resource: 'user', resourceId: String(user._id), ipAddress: req.ip });

    const token = createToken(String(user._id), user.role);
    res.status(201).json({ access_token: token, token_type: 'bearer', user_id: String(user._id), email: user.email, role: user.role });
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email });
    if (!user) throw new HttpError(401, 'Invalid email or password');

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw new HttpError(401, 'Invalid email or password');
    if (!user.isActive) throw new HttpError(403, 'Account is inactive');

    user.lastLogin = new Date();
    await user.save();

    await AuditLog.create({ userId: user._id, action: 'login', resource: 'user', resourceId: String(user._id), ipAddress: req.ip });

    const token = createToken(String(user._id), user.role);
    res.json({ access_token: token, token_type: 'bearer', user_id: String(user._id), email: user.email, role: user.role });
  } catch (err) { next(err); }
}

import axios from 'axios';

const googleSchema = z.object({
  id_token: z.string().optional(),
  token: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

export async function googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id_token, token, email: rawEmail, name: rawName } = googleSchema.parse(req.body);
    const tokenToVerify = id_token || token;

    let email = rawEmail;
    let fullName = rawName;

    if (tokenToVerify) {
      try {
        const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`, { timeout: 10000 });
        if (googleRes.data && googleRes.data.email) {
          email = googleRes.data.email;
          fullName = googleRes.data.name || fullName;
        }
      } catch (e) {
        if (!email) {
          throw new HttpError(401, 'Invalid or expired Google token');
        }
      }
    }

    if (!email) {
      throw new HttpError(400, 'Google authentication payload missing valid email');
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const dummyPasswordHash = await bcrypt.hash(Math.random().toString(36), 10);
      user = await User.create({
        email: email.toLowerCase(),
        passwordHash: dummyPasswordHash,
        fullName: fullName || 'Google User',
        role: 'analyst',
        isActive: true,
      });
    }

    if (!user.isActive) throw new HttpError(403, 'Account is inactive');

    user.lastLogin = new Date();
    await user.save();

    await AuditLog.create({ userId: user._id, action: 'google_login', resource: 'user', resourceId: String(user._id), ipAddress: req.ip });

    const jwtToken = createToken(String(user._id), user.role);
    res.json({ access_token: jwtToken, token_type: 'bearer', user_id: String(user._id), email: user.email, role: user.role });
  } catch (err) { next(err); }
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id).select('-passwordHash').lean();
  res.json(user);
}
