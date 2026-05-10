'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function resolveBackendUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  if (typeof window === 'undefined') {
    return envUrl;
  }
  try {
    const url = new URL(envUrl);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = window.location.hostname;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return envUrl;
  }
}

export function getSocket(): Socket {
  if (!socket) {
    const backendUrl = resolveBackendUrl();
    
    socket = io(backendUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to backend');
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from backend');
    });

    socket.on('reconnect', () => {
      console.log('[Socket] Reconnected to backend');
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });
  }

  return socket;
}

export function closeSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
