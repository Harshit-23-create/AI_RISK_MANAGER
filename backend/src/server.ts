import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { wsManager } from './websocket/wsManager';
import { config } from './config/env';
import { seedAdminUser } from './utils/seed';

async function start() {
  console.log('Starting AI Risk Manager Node.js backend...');

  // Connect to MongoDB
  await connectDB();

  // Seed admin user if not exists
  await seedAdminUser();

  // Connect to Redis (non-fatal)
  await connectRedis();

  // Create HTTP server
  const server = http.createServer(app);

  // Attach WebSocket server
  wsManager.attach(server);

  // Start listening
  server.listen(config.port, () => {
    console.log(`\n🚀 AI Risk Manager running on http://localhost:${config.port}`);
    console.log(`📊 API docs: http://localhost:${config.port}/health`);
    console.log(`🔌 WebSocket: ws://localhost:${config.port}/ws/risk-feed`);
    console.log(`🌍 Env: ${config.nodeEnv}\n`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down gracefully...');
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
