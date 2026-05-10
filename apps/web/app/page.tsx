'use client';

import { useConnectionStore, useDeviceStore } from '@/lib/stores';
import { getSocket } from '@/lib/socket';
import Link from 'next/link';

export default function HomePage() {
  const { state: connectionState, isConnected } = useConnectionStore();
  const { authenticatedDevice } = useDeviceStore();

  const statusColor = isConnected ? 'bg-green-500' : 'bg-red-500';
  const statusText = isConnected ? 'Connected' : 'Disconnected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-dark backdrop-blur-xl border-b border-slate-700/50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center font-bold text-white">
              ⚡
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Smart Auto Typer
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${statusColor}/20 border ${statusColor}/50`}>
              <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
              <span className="text-sm font-medium">{statusText}</span>
            </div>
            
            <Link
              href={authenticatedDevice ? '/controller' : '/devices'}
              className="btn-primary"
            >
              {authenticatedDevice ? 'Controller' : 'Connect Device'}
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Hero */}
          <section className="py-20 text-center">
            <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              Control Your Desktop
              <br />
              From Your Phone
            </h2>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience the future of remote input. Real-time, seamless typing control from your phone directly to your desktop. No delays, no compromise on quality.
            </p>

            <div className="flex gap-6 justify-center mb-20">
              <Link
                href="/devices"
                className="btn-primary text-lg px-8 py-3"
              >
                Get Started
              </Link>
              <Link
                href="/dashboard"
                className="btn-secondary text-lg px-8 py-3"
              >
                View Dashboard
              </Link>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="card text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">0ms</div>
                <p className="text-slate-400">Latency</p>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">100%</div>
                <p className="text-slate-400">Uptime</p>
              </div>
              <div className="card text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">∞</div>
                <p className="text-slate-400">Typing Speed</p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-20 border-t border-slate-700/50">
            <h3 className="text-3xl font-bold text-center mb-16">Features</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'Real-time Sync',
                  description: 'Instant synchronization between your phone and desktop',
                  icon: '⚡',
                },
                {
                  title: 'QR Pairing',
                  description: 'Secure device pairing with one scan',
                  icon: '📱',
                },
                {
                  title: 'Queue Management',
                  description: 'Efficient typing queue with status tracking',
                  icon: '📋',
                },
                {
                  title: 'Live Dashboard',
                  description: 'Monitor typing activity and system status in real-time',
                  icon: '📊',
                },
                {
                  title: 'Settings Control',
                  description: 'Customize typing speed and behavior',
                  icon: '⚙️',
                },
                {
                  title: 'Reconnect Logic',
                  description: 'Automatic reconnection with session persistence',
                  icon: '🔄',
                },
              ].map((feature) => (
                <div key={feature.title} className="card hover:border-blue-500/30 transition-all duration-300">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h4 className="text-lg font-bold mb-2">{feature.title}</h4>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-400">
          <p>© 2024 Smart Auto Typer. Premium realtime desktop companion ecosystem.</p>
        </div>
      </footer>
    </div>
  );
}
