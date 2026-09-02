import Redis from 'ioredis';
import { config } from './env';

export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null; // stop retrying
    return Math.min(times * 200, 2000);
  },
});

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', (err) => console.warn('[Redis] Error (non-fatal):', err.message));

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (err) {
    console.warn('[Redis] Could not connect — WebSocket broadcasting disabled:', err);
  }
}
