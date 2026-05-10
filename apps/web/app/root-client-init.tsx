'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useConnectionStore, useSettingsStore, useDeviceStore } from '@/lib/stores';
import { getSettings } from '@/lib/api';
import { usePathname } from 'next/navigation';

export default function RootClientInit() {
  const pathname = usePathname();
  const { setState: setConnectionState } = useConnectionStore();
  const { setSettings } = useSettingsStore();
  const { setAuthenticatedDevice } = useDeviceStore();

  useEffect(() => {
    if (pathname === '/pair' || pathname === '/pairing') {
      return;
    }

    const socket = getSocket();

    socket.on('connect', () => {
      setConnectionState('connected');
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socket.on('reconnecting', () => {
      setConnectionState('reconnecting');
    });

    (async () => {
      try {
        const result = await getSettings();
        if (result.success && result.settings) {
          setSettings(result.settings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    })();

    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (!session?.sessionToken) {
          localStorage.removeItem('session');
          setAuthenticatedDevice(null, null);
          return;
        }
        setAuthenticatedDevice(session.device, session.sessionToken);

        socket.emit('authenticate', { sessionToken: session.sessionToken }, (response: any) => {
          if (!response?.success) {
            localStorage.removeItem('session');
            setAuthenticatedDevice(null, null);
          }
        });
      } catch (error) {
        localStorage.removeItem('session');
      }
    }
  }, [pathname, setAuthenticatedDevice, setConnectionState, setSettings]);

  return null;
}
