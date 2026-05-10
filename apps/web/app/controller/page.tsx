'use client';

import { useState, useEffect, useRef } from 'react';
import { useConnectionStore, useDeviceStore, useQueueStore } from '@/lib/stores';
import { getSocket } from '@/lib/socket';
import Link from 'next/link';

export default function ControllerPage() {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const { isConnected } = useConnectionStore();
  const { authenticatedDevice, sessionToken } = useDeviceStore();
  const { queueLength } = useQueueStore();
  const socket = getSocket();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authenticatedDevice) {
      window.location.href = '/devices';
      return;
    }

    setIsAuthenticated(false);
    if (sessionToken) {
      socket.emit('authenticate', { sessionToken }, (response: any) => {
        setIsAuthenticated(Boolean(response?.success));
      });
    }

    socket.on('type:status', (data) => {
      setStatus(data);
    });

    socket.on('type:queue-updated', (data) => {
      setQueue(data.queue || []);
    });

    // Request initial status
    socket.emit('status:request', {}, (response: any) => {
      if (response?.success) {
        setStatus(response.typing);
        setQueue(response.queue || []);
      }
    });

    return () => {
      socket.off('type:status');
      socket.off('type:queue-updated');
    };
  }, [socket, authenticatedDevice]);

  const handleSend = async () => {
    if (!text.trim() || !isConnected || !isAuthenticated) return;

    try {
      setIsSending(true);
      socket.emit('type:send', { text, speed: 60 }, (response: any) => {
        if (response?.success) {
          setText('');
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        } else {
          alert(response?.error || 'Failed to send text');
        }
      });
    } catch (error) {
      console.error('Failed to send text:', error);
      alert('Failed to send text');
    } finally {
      setIsSending(false);
    }
  };

  const handleStop = () => {
    socket.emit('type:stop', {}, (response: any) => {
      if (response?.success) {
        setText('');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/" className="text-slate-400 hover:text-slate-300 mb-8 inline-block">
          ← Back
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controller */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">Type & Send</h2>

              <div className="mb-6">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your text here... (Ctrl+Enter to send)"
                  className="input-field min-h-[200px] resize-none font-mono"
                  disabled={!isConnected}
                />
                <div className="text-xs text-slate-500 mt-2">
                  {text.length} characters
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSend}
                  disabled={!isConnected || !isAuthenticated || !text.trim() || isSending}
                  className="btn-primary flex-1 py-3"
                >
                  {isSending ? 'Sending...' : 'Send Text'}
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isConnected}
                  className="btn-secondary flex-1 py-3"
                >
                  Stop
                </button>
              </div>

              {!isConnected && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-sm">
                  Not connected to backend. Please check your connection.
                </div>
              )}
              {isConnected && !isAuthenticated && (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-sm">
                  Authenticating device session... please wait a moment.
                </div>
              )}
            </div>

            {/* Status Card */}
            {status && (
              <div className="card mt-6">
                <h3 className="text-lg font-bold mb-4">Typing Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">State</p>
                    <p className="text-lg font-bold text-blue-400 capitalize">
                      {status.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Queue Length</p>
                    <p className="text-lg font-bold text-purple-400">
                      {status.queueLength}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Speed</p>
                    <p className="text-lg font-bold text-green-400">
                      {status.speed} WPM
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Est. Time Remaining</p>
                    <p className="text-lg font-bold text-yellow-400">
                      {status.estimatedTimeRemaining}s
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connection Card */}
            <div className="card">
              <h3 className="font-bold mb-4">Connection</h3>
              <div
                className={`p-3 rounded-lg border flex items-center gap-3 ${
                  isConnected
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  } animate-pulse`}
                />
                <span className={isConnected ? 'text-green-300' : 'text-red-300'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Device Info */}
            {authenticatedDevice && (
              <div className="card">
                <h3 className="font-bold mb-4">Device Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-400">Name</p>
                    <p className="font-medium">{authenticatedDevice.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Type</p>
                    <p className="font-medium capitalize">{authenticatedDevice.type}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Paired At</p>
                    <p className="font-medium text-xs">
                      {new Date(authenticatedDevice.pairedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-bold mb-4">Actions</h3>
              <Link href="/dashboard" className="btn-secondary w-full py-2 text-center mb-2 block">
                Dashboard
              </Link>
              <Link href="/settings" className="btn-secondary w-full py-2 text-center block">
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Queue Preview */}
        {queue.length > 0 && (
          <div className="card mt-6">
            <h3 className="text-lg font-bold mb-4">Queue Preview</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {queue.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 bg-slate-800/50 rounded border border-slate-700/50 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">#{idx + 1}</span>
                    <span className={`badge-${item.status === 'completed' ? 'success' : 'info'}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-slate-300 truncate">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
