/**
 * Integration tests for the Auth API endpoints.
 *
 * These tests use supertest to fire real HTTP requests against the Express app
 * WITHOUT starting the full server (no listen() call). MongoDB and Redis
 * connections are mocked so tests run in isolation without external services.
 *
 * Tests cover:
 *   POST /api/auth/register  — validation, duplicate email, success
 *   POST /api/auth/login     — wrong password, inactive account, success
 *   GET  /api/auth/me        — unauthenticated vs authenticated
 */

import request from 'supertest';
import app from '../app';

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock mongoose so no real DB connection is needed
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(undefined),
    connection: { readyState: 1, db: null },
  };
});

// Mock Redis so no real Redis connection is needed
jest.mock('../config/redis', () => ({
  redis: {
    status: 'ready',
    get: jest.fn(),
    set: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    on: jest.fn(),
  },
}));

// Mock User model
jest.mock('../models/User', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

// Mock AuditLog model
jest.mock('../models/AuditLog', () => ({
  AuditLog: {
    create: jest.fn().mockResolvedValue({}),
  },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$hashedpassword'),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
}));

// Import mocked modules for test control
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  passwordHash: '$2a$12$hashedpassword',
  role: 'analyst',
  isActive: true,
  lastLogin: new Date(),
  save: jest.fn().mockResolvedValue(undefined),
};

// ── Test Suites ───────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('backend');
  });

  it('includes mongodb and redis fields', async () => {
    const res = await request(app).get('/api/health');
    expect(typeof res.body.mongodb).toBe('boolean');
    expect(typeof res.body.redis).toBe('boolean');
  });
});

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ password: 'Password1!' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'user@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is invalid format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'Password1!' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is already registered', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'existing@example.com', password: 'Password1!' });
    expect(res.status).toBe(400);
  });

  it('returns 201 with access_token on successful registration', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(null);
    (User.create as jest.Mock).mockResolvedValueOnce(mockUser);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'newuser@example.com', password: 'Password1!', full_name: 'New User' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('role');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when body is empty', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 when user does not exist', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1!' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when password is wrong', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPassword!' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when user account is inactive', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce({ ...mockUser, isActive: false });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password1!' });
    expect(res.status).toBe(403);
  });

  it('returns 200 with access_token on successful login', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password1!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body.token_type).toBe('bearer');
  });

  it('includes user_id, email, and role in response', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password1!' });
    expect(res.body).toHaveProperty('user_id');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('role');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header is malformed', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'NotBearer token');
    expect(res.status).toBe(401);
  });

  it('returns 401 when JWT token is invalid', async () => {
    (jwt.verify as jest.Mock).mockImplementationOnce(() => {
      throw new Error('invalid signature');
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  it('returns 200 with user profile for valid token', async () => {
    (jwt.verify as jest.Mock).mockReturnValueOnce({ sub: mockUser._id, role: 'analyst' });
    const mockQuery: any = {
      lean: jest.fn().mockResolvedValue(mockUser),
      select: jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue({
          _id: mockUser._id,
          email: mockUser.email,
          role: mockUser.role,
        }),
      })),
    };
    (User.findById as jest.Mock).mockReturnValue(mockQuery);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid.jwt.token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email');
  });
});
