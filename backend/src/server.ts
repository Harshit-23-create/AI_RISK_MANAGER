import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { wsManager } from './websocket/wsManager';
import { config } from './config/env';
import { seedAdminUser } from './utils/seed';

async function start() {
  console.log('Starting AI Risk Manager Node.js backend...');

  await connectDB();

  await seedAdminUser();

  await connectRedis();

  const server = http.createServer(app);

  wsManager.attach(server);

  server.listen(config.port, () => {
    console.log(`\n🚀 AI Risk Manager running on http://localhost:${config.port}`);
    console.log(`📊 API docs: http://localhost:${config.port}/health`);
    console.log(`🔌 WebSocket: ws://localhost:${config.port}/ws/risk-feed`);
    console.log(`🌍 Env: ${config.nodeEnv}\n`);
  });

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
