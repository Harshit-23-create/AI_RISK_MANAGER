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
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
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

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id).select('-passwordHash').lean();
  res.json(user);
}
