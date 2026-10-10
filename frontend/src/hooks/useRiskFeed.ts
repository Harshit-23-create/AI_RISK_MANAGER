import { useEffect, useRef, useCallback, useState } from 'react';
import type { RiskFeedEvent } from '../types';
import { generateMockRiskFeedEvent } from '../services/mockData';

const getWsUrl = () => {
  return import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
};

const WS_URL = getWsUrl();

export type WsStatus = 'connected' | 'reconnecting' | 'offline';

export function useRiskFeed(onEvent: (event: RiskFeedEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mockFeedTimer = useRef<ReturnType<typeof setInterval> | null>(null);
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

    try {
      setStatus('reconnecting');
      const ws = new WebSocket(`${WS_URL}/ws/risk-feed`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        if (mockFeedTimer.current) {
          clearInterval(mockFeedTimer.current);
          mockFeedTimer.current = null;
        }
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as RiskFeedEvent;
          if (data.type !== 'ping') {
            setEventCount(c => c + 1);
            onEventRef.current(data);
          }
        } catch {
          // ignore malformed ws messages
        }
      };

      ws.onclose = () => {
        setStatus('reconnecting');
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setStatus('offline');
    }

    // In demo mode or offline, simulate live feed ticks so the operations center feels dynamic
    if (!mockFeedTimer.current) {
      mockFeedTimer.current = setInterval(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          const mockEvent = generateMockRiskFeedEvent();
          setEventCount(c => c + 1);
          onEventRef.current(mockEvent);
        }
      }, 6000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (mockFeedTimer.current) clearInterval(mockFeedTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected: status === 'connected', status, eventCount };
}
