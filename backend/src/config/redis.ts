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

export const redisSubscriber = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null; // stop retrying
    return Math.min(times * 200, 2000);
  },
});

redis.on('error', (err) => console.warn('[Redis] Error (non-fatal):', err.message));

redisSubscriber.on('error', (err) => console.warn('[Redis Subscriber] Error (non-fatal):', err.message));

export async function connectRedis(): Promise<void> {
  console.log('[Redis] Initializing normal client');
  try {
    if (redis.status === 'wait') {
      await redis.connect();
    }
    console.log('[Redis] Connected');
  } catch (err) {
    console.warn('[Redis] Could not connect:', (err as Error).message);
  }
  
  console.log('[Redis Subscriber] Initializing subscriber');
  try {
    if (redisSubscriber.status === 'wait') {
      await redisSubscriber.connect();
    }
    console.log('[Redis Subscriber] Connected');
    
    if (redisSubscriber.status === 'ready' || redisSubscriber.status === 'connect') {
      await redisSubscriber.subscribe('risk-events');
      console.log('[Redis Subscriber] Subscribed to risk-events');
    }
  } catch (err) {
    console.warn('[Redis Subscriber] Could not connect or subscribe — WebSocket broadcasting disabled:', (err as Error).message);
  }
}
