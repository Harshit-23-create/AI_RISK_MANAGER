import { useEffect, useRef, useCallback, useState } from 'react';
import type { RiskFeedEvent } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export type WsStatus = 'connected' | 'reconnecting' | 'offline';

export function useRiskFeed(onEvent: (event: RiskFeedEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<WsStatus>('offline');
  const [eventCount, setEventCount] = useState(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setStatus('offline');
      return;
    }

    setStatus('reconnecting');
    const ws = new WebSocket(`${WS_URL}/ws/risk-feed`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      console.log('[WS] Connected to risk feed');
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as RiskFeedEvent;
        if (data.type !== 'ping') {
          setEventCount(c => c + 1);
          onEventRef.current(data);
        }
      } catch {

      }
    };

    ws.onclose = () => {
      setStatus('reconnecting');
      console.log('[WS] Disconnected — reconnecting in 3s...');
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      reconnectTimer.current && clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected: status === 'connected', status, eventCount };
}
