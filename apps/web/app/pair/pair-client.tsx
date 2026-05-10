'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

type PairResponse = {
  success: boolean;
  error?: string;
  device?: {
    id: string;
    name: string;
    sessionToken: string;
    pairedAt: string;
  };
};

export default function PairClient() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get('code') || '';
  const backend = params.get('backend') || '';
  const [state, setState] = useState<'idle' | 'pairing' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('Preparing pairing...');

  const deviceName = useMemo(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Phone';
    return `Phone-${ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iPhone' : 'Mobile'}`;
  }, []);

  useEffect(() => {
    if (!code || !backend) {
      setState('error');
      setMessage('Invalid pairing link. Please scan a new QR code.');
      return;
    }

    setState('pairing');
    setMessage('Connecting to desktop...');
    const timeout = setTimeout(() => {
      setState('error');
      setMessage('Pairing timed out. Please generate a new QR code and try again.');
    }, 12000);

    (async () => {
      try {
        const response = await axios.post<PairResponse>('/api/pair/complete', {
          pairingCode: code,
          deviceName,
          backend,
        }, { timeout: 10000 });
        clearTimeout(timeout);
        const result = response.data;
        if (!result?.success || !result.device) {
          setState('error');
          setMessage(result?.error || 'Pairing failed');
          return;
        }

        localStorage.setItem(
          'session',
          JSON.stringify({
            device: result.device,
            sessionToken: result.device.sessionToken,
          })
        );

        setState('ok');
        setMessage('Paired successfully. Redirecting to controller...');
        setTimeout(() => router.replace('/controller'), 900);
      } catch (error) {
        clearTimeout(timeout);
        setState('error');
        setMessage('Could not reach backend. Ensure phone and desktop are on same Wi-Fi.');
      }
    })();

    return () => clearTimeout(timeout);
  }, [backend, code, deviceName, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-100 flex items-center justify-center px-6">
      <div className="card max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-3">Phone Pairing</h1>
        <p className="text-slate-300 mb-4">{message}</p>
        <p className="text-xs text-slate-500 break-all">Code: {code || 'N/A'}</p>
        <p className={`mt-3 text-sm ${state === 'error' ? 'text-red-400' : state === 'ok' ? 'text-green-400' : 'text-blue-400'}`}>
          {state === 'error' ? 'Pairing failed' : state === 'ok' ? 'Pairing complete' : 'Pairing in progress'}
        </p>
      </div>
    </div>
  );
}
