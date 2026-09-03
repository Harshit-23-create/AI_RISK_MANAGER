import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import { setupSwagger } from './utils/swagger';

import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import riskRoutes from './routes/risk';
import alertRoutes from './routes/alerts';
import dashboardRoutes from './routes/dashboard';
import networkRoutes from './routes/network';
import simulationRoutes from './routes/simulation';
import explainRoutes from './routes/explain';
import modelsRoutes from './routes/models';

const app = express();

// ── Security, Rate Limiting & Logging ─────────────────────────────────────────
const allowedOrigins = [
  config.frontendUrl,
  'https://ai-risk-manager-chi.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: [
        "'self'",
        config.frontendUrl,
        config.mlServiceUrl,
        ...(config.nodeEnv === 'development' ? ["http://localhost:*", "ws://localhost:*"] : []),
      ].filter(Boolean),
    },
  },
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // and origins that match our allowed array.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Use Winston for Morgan stream
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// General Rate Limiter (Increased for demo polling)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased limit for local demo
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } }
});
app.use('/api', limiter);

// Strict Rate Limiter for Auth & Transactions (Increased for demo simulation)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased limit for simulation testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests to this endpoint.' } }
});

// ── Swagger Docs ─────────────────────────────────────────────────────────────
setupSwagger(app);


// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        strictLimiter, authRoutes);
app.use('/api/transactions',strictLimiter, transactionRoutes);
app.use('/api/risk',        riskRoutes);
app.use('/api/alerts',      alertRoutes);
app.use('/api/dashboard',   dashboardRoutes);
app.use('/api/network',     networkRoutes);
app.use('/api/simulation',  simulationRoutes);
app.use('/api/explain',     explainRoutes);
app.use('/api/models',      modelsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
