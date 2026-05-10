'use client';

import { useState, useEffect } from 'react';
import { getEngineStatus, getLogs, getDevices } from '@/lib/api';
import { useConnectionStore } from '@/lib/stores';
import { getSocket } from '@/lib/socket';
import { formatUptime } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected } = useConnectionStore();
  const socket = getSocket();

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const [engineData, logsData, devicesData] = await Promise.all([
        getEngineStatus(),
        getLogs({ limit: 20 }),
        getDevices(),
      ]);

      if (engineData?.success) {
        setEngineStatus(engineData.engine);
      }
      if (logsData?.success) {
        setLogs(logsData.logs);
      }
      if (devicesData?.success) {
        setDevices(devicesData.devices);
      }

      // Request health from socket
      socket.emit('health:request', {}, (response: any) => {
        if (response?.success && response.health) {
          setHealth(response.health);
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <Link href="/" className="text-slate-400 hover:text-slate-300 mb-8 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          System Dashboard
        </h1>

        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Loading dashboard...</div>
        ) : (
          <>
            {/* Health Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {health && (
                <>
                  <div className="card text-center">
                    <p className="text-slate-400 text-sm mb-2">Backend</p>
                    <div className="text-3xl font-bold mb-2">
                      <span className={health.backend ? 'text-green-400' : 'text-red-400'}>
                        {health.backend ? '✓' : '✗'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs">
                      {health.backend ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  <div className="card text-center">
                    <p className="text-slate-400 text-sm mb-2">Database</p>
                    <div className="text-3xl font-bold mb-2">
                      <span className={health.database ? 'text-green-400' : 'text-red-400'}>
                        {health.database ? '✓' : '✗'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs">
                      {health.database ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                  <div className="card text-center">
                    <p className="text-slate-400 text-sm mb-2">Socket.IO</p>
                    <div className="text-3xl font-bold mb-2">
                      <span className={health.socket ? 'text-green-400' : 'text-red-400'}>
                        {health.socket ? '✓' : '✗'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs">
                      {health.socket ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                  <div className="card text-center">
                    <p className="text-slate-400 text-sm mb-2">Uptime</p>
                    <p className="text-lg font-bold text-blue-400">
                      {formatUptime(health.uptime)}
                    </p>
                    <p className="text-slate-500 text-xs">Total</p>
                  </div>
                </>
              )}
            </div>

            {/* Engine Status */}
            {engineStatus && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="card">
                  <h3 className="text-sm text-slate-400 mb-2">Engine Status</h3>
                  <p className="text-3xl font-bold text-blue-400 mb-2">
                    {engineStatus.running ? 'Running' : 'Stopped'}
                  </p>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      engineStatus.running
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {engineStatus.running ? 'Online' : 'Offline'}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-sm text-slate-400 mb-2">Queue Length</h3>
                  <p className="text-3xl font-bold text-purple-400">
                    {engineStatus.queueLength}
                  </p>
                  <p className="text-xs text-slate-500">items pending</p>
                </div>

                <div className="card">
                  <h3 className="text-sm text-slate-400 mb-2">Typed Total</h3>
                  <p className="text-3xl font-bold text-green-400">
                    {engineStatus.typedTotal}
                  </p>
                  <p className="text-xs text-slate-500">characters</p>
                </div>
              </div>
            )}

            {/* Devices Section */}
            <div className="card mb-8">
              <h3 className="text-lg font-bold mb-4">Connected Devices ({devices.length})</h3>
              {devices.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No devices connected. <Link href="/devices" className="text-blue-400 hover:text-blue-300">Pair a device</Link>
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-slate-100">{device.name}</h4>
                          <p className="text-xs text-slate-500 capitalize">{device.type}</p>
                        </div>
                        {device.trusted && (
                          <span className="badge-success">Trusted</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Last seen:{' '}
                        {new Date(device.lastSeen).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logs Section */}
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Recent Logs</h3>
              {logs.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No logs yet</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-800/50 rounded border border-slate-700/50 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`badge badge-${log.level}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500">
                          {log.category}
                        </span>
                        <span className="text-xs text-slate-600">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
