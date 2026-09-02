import mongoose from 'mongoose';
import { config } from './env';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[MongoDB] Connected to', config.mongoUri);
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err);
    throw err;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB] Disconnected');
});
