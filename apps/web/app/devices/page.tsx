'use client';

import { useState, useEffect } from 'react';
import { generateQR, getDevices, getNetworkInfo } from '@/lib/api';
import { useDeviceStore, useConnectionStore } from '@/lib/stores';
import { getSocket } from '@/lib/socket';
import Image from 'next/image';
import Link from 'next/link';

export default function DevicesPage() {
  const [qrCode, setQrCode] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { authenticatedDevice, setAuthenticatedDevice } = useDeviceStore();
  const { isConnected } = useConnectionStore();
  const socket = getSocket();

  useEffect(() => {
    loadDevices();
    
    socket.on('device:paired', (data) => {
      loadDevices();
    });

    return () => {
      socket.off('device:paired');
    };
  }, [socket]);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const result = await getDevices();
      if (result.success) {
        setDevices(result.devices);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      setIsGenerating(true);
      let host = window.location.hostname;
      const protocol = window.location.protocol;
      if (host === 'localhost' || host === '127.0.0.1') {
        const network = await getNetworkInfo();
        if (network.success && network.host) {
          host = network.host;
        }
      }
      const backendUrl = `${protocol}//${host}:4000`;
      const frontendUrl = `${protocol}//${host}:3000`;
      const result = await generateQR(backendUrl, frontendUrl);
      
      setQrCode(result.qrCode);
      setPairingCode(result.code);
    } catch (error) {
      console.error('Failed to generate QR:', error);
      alert('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePairDevice = (device: any) => {
    try {
      const session = {
        device,
        sessionToken: device.sessionToken,
      };
      localStorage.setItem('session', JSON.stringify(session));
      setAuthenticatedDevice(device, device.sessionToken);
      
      // Authenticate with socket
      socket.emit('authenticate', { sessionToken: device.sessionToken }, (response: any) => {
        if (response?.success) {
          window.location.href = '/controller';
        } else {
          alert('Failed to authenticate');
        }
      });
    } catch (error) {
      console.error('Failed to pair device:', error);
      alert('Failed to pair device');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <Link href="/" className="text-slate-400 hover:text-slate-300 mb-8 inline-block">
          ← Back
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Section */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Pair New Device</h2>
            
            {!qrCode ? (
              <button
                onClick={handleGenerateQR}
                disabled={isGenerating}
                className="btn-primary w-full py-3 mb-4"
              >
                {isGenerating ? 'Generating...' : 'Generate QR Code'}
              </button>
            ) : (
              <div>
                <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: `<svg width="300" height="300"></svg>`,
                    }}
                    style={{
                      backgroundImage: `url(${qrCode})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      width: '300px',
                      height: '300px',
                    }}
                  />
                </div>
                <p className="text-center text-lg font-mono font-bold text-blue-400 mb-4">
                  Code: {pairingCode}
                </p>
                <p className="text-slate-400 text-sm mb-4">
                  Scan this QR code with your phone to open the pairing page
                </p>
                <button
                  onClick={() => {
                    setQrCode('');
                    setPairingCode('');
                  }}
                  className="btn-secondary w-full py-2"
                >
                  Generate New Code
                </button>
              </div>
            )}
          </div>

          {/* Devices Section */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Paired Devices</h2>
            
            {isLoading ? (
              <div className="text-center text-slate-400 py-8">Loading devices...</div>
            ) : devices.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                No devices paired yet. Scan the QR code to pair your first device.
              </div>
            ) : (
              <div className="space-y-4">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-slate-100">{device.name}</h3>
                        <p className="text-xs text-slate-500">
                          {device.type} • {device.trusted ? 'Trusted' : 'Not trusted'}
                        </p>
                      </div>
                      {device.trusted && (
                        <span className="badge-success">Trusted</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Last seen: {new Date(device.lastSeen).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handlePairDevice(device)}
                      disabled={authenticatedDevice?.id === device.id}
                      className={`w-full py-2 rounded-lg font-medium transition-all ${
                        authenticatedDevice?.id === device.id
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'btn-secondary'
                      }`}
                    >
                      {authenticatedDevice?.id === device.id ? '✓ Active' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
