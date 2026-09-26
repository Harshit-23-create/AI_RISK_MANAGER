import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { wsManager } from './websocket/wsManager';
import { config } from './config/env';
import { seedAdminUser } from './utils/seed';
import { maybeAutoStartSimulation } from './services/simulationService';

async function start() {
  console.log('Starting AI Risk Manager Node.js backend...');

  // 1. Connect to MongoDB
  await connectDB();

  // 2. Seed admin user (idempotent — skips if already exists)
  await seedAdminUser();

  // 3. Connect to Redis
  await connectRedis();

  // 4. Start HTTP server
  const server = http.createServer(app);

  // 5. Attach WebSocket server
  wsManager.attach(server);

  server.listen(config.port, () => {
    console.log(`\n🚀 AI Risk Manager running on http://localhost:${config.port}`);
    console.log(`📊 API docs: http://localhost:${config.port}/api/health`);
    console.log(`🔌 WebSocket: ws://localhost:${config.port}/ws/risk-feed`);
    console.log(`🌍 Env: ${config.nodeEnv}\n`);

    // 6. OPTIONAL: Auto-start simulation only if SIMULATION_ENABLED=true
    //    By default this is OFF. Set SIMULATION_ENABLED=true in .env to enable.
    maybeAutoStartSimulation();
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
