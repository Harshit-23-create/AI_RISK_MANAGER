import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_risk_manager',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',

  jwtSecret: process.env.JWT_SECRET || process.env.SECRET_KEY || 'CHANGE_ME_TO_A_RANDOM_64_CHAR_STRING',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '60m',

  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8001',

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  openaiApiKey: process.env.OPENAI_API_KEY || '',
  googleApiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '',
  llmProvider: process.env.LLM_PROVIDER || 'mock',

  // Risk thresholds
  riskAllow: parseInt(process.env.RISK_THRESHOLD_ALLOW || '30', 10),
  riskMonitor: parseInt(process.env.RISK_THRESHOLD_MONITOR || '60', 10),
  riskStepup: parseInt(process.env.RISK_THRESHOLD_STEPUP || '80', 10),
};
