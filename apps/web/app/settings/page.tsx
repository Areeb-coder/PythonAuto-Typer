'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/lib/api';
import { useSettingsStore } from '@/lib/stores';
import Link from 'next/link';

export default function SettingsPage() {
  const { settings, setSettings } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getSettings();
      if (result.success && result.settings) {
        setSettings(result.settings);
        setFormData(result.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!formData) return;

    try {
      setIsSaving(true);
      const result = await updateSettings(formData);
      if (result.success) {
        setSettings(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 pt-20 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        <Link href="/" className="text-slate-400 hover:text-slate-300 mb-8 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Loading settings...</div>
        ) : formData ? (
          <div className="space-y-6">
            {/* Typing Settings */}
            <div className="card">
              <h2 className="text-lg font-bold mb-6">Typing Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Typing Speed (WPM)
                  </label>
                  <input
                    type="number"
                    value={formData.typingSpeed}
                    onChange={(e) => handleChange('typingSpeed', parseInt(e.target.value))}
                    min="10"
                    max="300"
                    className="input-field"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Characters per second: {Math.round(formData.typingSpeed / 5)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Typing Delay (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.typingDelay}
                    onChange={(e) => handleChange('typingDelay', parseInt(e.target.value))}
                    min="0"
                    max="5000"
                    className="input-field"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Delay before typing starts
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Emergency Stop Key
                  </label>
                  <select
                    value={formData.emergencyStopKey}
                    onChange={(e) => handleChange('emergencyStopKey', e.target.value)}
                    className="input-field"
                  >
                    <option>Escape</option>
                    <option>F1</option>
                    <option>F2</option>
                    <option>F3</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Connection Settings */}
            <div className="card">
              <h2 className="text-lg font-bold mb-6">Connection Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Reconnect Behavior
                  </label>
                  <select
                    value={formData.reconnectBehavior}
                    onChange={(e) => handleChange('reconnectBehavior', e.target.value)}
                    className="input-field"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Auto Reconnect
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.autoReconnect}
                    onChange={(e) => handleChange('autoReconnect', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Automatically reconnect when connection is lost
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Reconnect Interval (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.reconnectInterval}
                    onChange={(e) => handleChange('reconnectInterval', parseInt(e.target.value))}
                    min="100"
                    max="30000"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Reconnect Attempts
                  </label>
                  <input
                    type="number"
                    value={formData.maxReconnectAttempts}
                    onChange={(e) => handleChange('maxReconnectAttempts', parseInt(e.target.value))}
                    min="-1"
                    className="input-field"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    -1 for unlimited
                  </p>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="card">
              <h2 className="text-lg font-bold mb-6">Appearance</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Theme
                </label>
                <select
                  value={formData.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  className="input-field"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>

            {/* Backend Configuration */}
            <div className="card">
              <h2 className="text-lg font-bold mb-6">Backend Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Backend IP
                  </label>
                  <input
                    type="text"
                    value={formData.backendIp}
                    onChange={(e) => handleChange('backendIp', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    WebSocket URL
                  </label>
                  <input
                    type="text"
                    value={formData.websocketUrl}
                    onChange={(e) => handleChange('websocketUrl', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold mb-6">AI Assist Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    AI Mode
                  </label>
                  <select
                    value={formData.aiMode || 'solve'}
                    onChange={(e) => handleChange('aiMode', e.target.value)}
                    className="input-field"
                  >
                    <option value="solve">solve</option>
                    <option value="explain">explain</option>
                    <option value="simplify">simplify</option>
                    <option value="rewrite">rewrite</option>
                    <option value="answer-only">answer-only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    OCR Provider
                  </label>
                  <select
                    value={formData.ocrProvider || 'paddle'}
                    onChange={(e) => handleChange('ocrProvider', e.target.value)}
                    className="input-field"
                  >
                    <option value="paddle">PaddleOCR</option>
                    <option value="huggingface">Hugging Face OCR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Preprocessing Quality
                  </label>
                  <select
                    value={formData.preprocessingQuality || 'balanced'}
                    onChange={(e) => handleChange('preprocessingQuality', e.target.value)}
                    className="input-field"
                  >
                    <option value="fast">fast</option>
                    <option value="balanced">balanced</option>
                    <option value="high">high</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Capture Resolution
                  </label>
                  <select
                    value={formData.captureResolution || 'medium'}
                    onChange={(e) => handleChange('captureResolution', e.target.value)}
                    className="input-field"
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex-1 py-3"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={() => {
                  setFormData(settings);
                  setSaved(false);
                }}
                className="btn-secondary flex-1 py-3"
              >
                Reset
              </button>
            </div>

            {saved && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-200">
                ✓ Settings saved successfully
              </div>
            )}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-slate-400">Failed to load settings</p>
          </div>
        )}
      </div>
    </div>
  );
}
