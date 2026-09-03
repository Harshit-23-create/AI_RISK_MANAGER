/**
 * WebSocket Manager — broadcasts risk events to all connected clients.
 * Compatible with /ws/risk-feed endpoint expected by the React frontend.
 */
import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';

import { redisSubscriber } from '../config/redis';

class WsManager {
  private wss: WebSocketServer | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  attach(server: http.Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws/risk-feed' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WS] Client connected. Total:', this.wss?.clients.size);

      ws.on('close', () => {
        console.log('[WS] Client disconnected. Total:', this.wss?.clients.size);
      });

      ws.on('error', () => ws.terminate());
    });

    // Send pings every 30 seconds to keep connections alive
    this.pingInterval = setInterval(() => {
      this.broadcast({ type: 'ping' });
    }, 30000);

    // Listen for Redis pub/sub messages (subscription happens in connectRedis)
    redisSubscriber.on('message', (channel, message) => {
      if (channel === 'risk-events') {
        try {
          const parsed = JSON.parse(message);
          this.broadcast(parsed);
        } catch (e) {
          console.error('[WS] Failed to parse Redis message:', e);
        }
      }
    });

    console.log('[WS] WebSocket server attached to /ws/risk-feed');
  }

  broadcast(message: object): void {
    if (!this.wss) return;
    const payload = JSON.stringify(message);
    this.wss.clients.forEach((ws: WebSocket) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload, (err?: Error) => {
          if (err) console.warn('[WS] Send error:', err.message);
        });
      }
    });
  }

  get clientCount(): number {
    return this.wss?.clients.size ?? 0;
  }
}

export const wsManager = new WsManager();
