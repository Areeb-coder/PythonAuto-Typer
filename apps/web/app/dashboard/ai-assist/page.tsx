'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import { useDeviceStore, useSettingsStore } from '@/lib/stores';
import {
  approveAiAssistTyping,
  getAiAssistSessions,
  getGeminiKeyHint,
  processAiAssist,
  saveGeminiKey,
} from '@/lib/api';

type AIMode = 'solve' | 'explain' | 'simplify' | 'rewrite' | 'answer-only';

export default function AIAssistPage() {
  const socket = getSocket();
  const { authenticatedDevice } = useDeviceStore();
  const { settings } = useSettingsStore();

  const [geminiKey, setGeminiKey] = useState('');
  const [geminiHint, setGeminiHint] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [mode, setMode] = useState<AIMode>((settings?.aiMode as AIMode) || 'solve');
  const [ocrProvider, setOcrProvider] = useState<'paddle' | 'huggingface'>((settings?.ocrProvider as 'paddle' | 'huggingface') || 'paddle');
  const [preprocessingQuality, setPreprocessingQuality] = useState<'fast' | 'balanced' | 'high'>((settings?.preprocessingQuality as 'fast' | 'balanced' | 'high') || 'balanced');

  const [ocrOutput, setOcrOutput] = useState<any>(null);
  const [aiOutput, setAiOutput] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [versions, setVersions] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const confidence = useMemo(() => {
    if (!ocrOutput?.confidence?.length) return 0;
    const total = ocrOutput.confidence.reduce((a: number, b: number) => a + b, 0);
    return Math.round((total / ocrOutput.confidence.length) * 100);
  }, [ocrOutput]);

  useEffect(() => {
    void load();
    void loadHint();

    const events = [
      'capture-start',
      'capture-complete',
      'ocr-start',
      'ocr-complete',
      'ai-start',
      'ai-complete',
      'review-ready',
      'typing-approved',
    ];

    events.forEach((event) => {
      socket.on(event, () => {
        setLogs((prev) => [`${new Date().toLocaleTimeString()} ${event}`, ...prev].slice(0, 50));
      });
    });

    return () => {
      events.forEach((event) => socket.off(event));
    };
  }, []);

  async function load() {
    const data = await getAiAssistSessions(8);
    if (data?.success) setSessions(data.sessions || []);
  }

  async function loadHint() {
    const result = await getGeminiKeyHint();
    if (result?.success) setGeminiHint(result.hint || null);
  }

  async function onSaveKey() {
    if (!geminiKey.trim()) return;
    const result = await saveGeminiKey(geminiKey.trim());
    if (result?.success) {
      setGeminiKey('');
      await loadHint();
    }
  }

  async function onProcess() {
    if (!imageBase64.trim()) {
      alert('Paste base64 image content to run AI Assist');
      return;
    }
    setIsProcessing(true);
    try {
      const response = await processAiAssist({
        imageBase64: imageBase64.trim(),
        mode,
        ocrProvider,
        preprocessingQuality,
        deviceId: authenticatedDevice?.id,
        source: 'region',
      });

      if (!response?.success) {
        alert(response?.error || 'Processing failed');
        return;
      }

      const result = response.result;
      setOcrOutput(result.ocr);
      setAiOutput(result.aiOutput || '');
      setReviewText(result.aiOutput || '');
      setVersions((prev) => [result.aiOutput || '', ...prev].slice(0, 5));
      await load();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function onRegenerate() {
    await onProcess();
  }

  async function onApproveTyping() {
    if (!reviewText.trim() || !authenticatedDevice?.id) {
      alert('Device must be paired and review text cannot be empty');
      return;
    }

    const response = await approveAiAssistTyping({
      text: reviewText,
      speed: settings?.typingSpeed || 60,
      deviceId: authenticatedDevice.id,
    });

    if (!response?.success) {
      alert(response?.error || 'Failed to approve typing');
      return;
    }

    setLogs((prev) => [`${new Date().toLocaleTimeString()} typing queued`, ...prev]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-300 mb-6 inline-block">
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
          AI Assist Workspace
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Setup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Gemini API Key</label>
                  <input className="input-field" type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder={geminiHint || 'Enter key'} />
                  <button className="btn-secondary mt-2" onClick={onSaveKey}>Save Key Securely</button>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Mode</label>
                  <select className="input-field" value={mode} onChange={(e) => setMode(e.target.value as AIMode)}>
                    <option value="solve">solve</option>
                    <option value="explain">explain</option>
                    <option value="simplify">simplify</option>
                    <option value="rewrite">rewrite</option>
                    <option value="answer-only">answer-only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">OCR Provider</label>
                  <select className="input-field" value={ocrProvider} onChange={(e) => setOcrProvider(e.target.value as 'paddle' | 'huggingface')}>
                    <option value="paddle">PaddleOCR (primary)</option>
                    <option value="huggingface">Hugging Face (fallback)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Preprocessing Quality</label>
                  <select className="input-field" value={preprocessingQuality} onChange={(e) => setPreprocessingQuality(e.target.value as 'fast' | 'balanced' | 'high')}>
                    <option value="fast">fast</option>
                    <option value="balanced">balanced</option>
                    <option value="high">high</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold mb-4">Capture Input</h2>
              <textarea className="input-field min-h-[140px] font-mono" value={imageBase64} onChange={(e) => setImageBase64(e.target.value)} placeholder="Paste captured image as base64 from capture-engine" />
              <div className="flex gap-3 mt-3">
                <button className="btn-primary" disabled={isProcessing} onClick={onProcess}>{isProcessing ? 'Processing...' : 'Run AI Assist'}</button>
                <button className="btn-secondary" disabled={isProcessing} onClick={onRegenerate}>Regenerate</button>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold mb-4">Review Panel</h2>
              <p className="text-sm text-slate-400 mb-3">Confidence: {confidence}%</p>
              <textarea className="input-field min-h-[220px]" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
              <div className="flex gap-3 mt-3">
                <button className="btn-primary" onClick={onApproveTyping}>Send To Typing (Approved)</button>
                <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(reviewText)}>Copy</button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="font-bold mb-3">OCR Output</h3>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap">{JSON.stringify(ocrOutput, null, 2)}</pre>
            </div>

            <div className="card">
              <h3 className="font-bold mb-3">AI Result</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{aiOutput || 'No output yet'}</p>
            </div>

            <div className="card">
              <h3 className="font-bold mb-3">Version Compare</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {versions.map((v, i) => (
                  <div key={i} className="p-2 rounded bg-slate-800/70 border border-slate-700 text-xs text-slate-300">{v}</div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold mb-3">Realtime Logs</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto text-xs text-slate-300">
                {logs.map((log, i) => <p key={i}>{log}</p>)}
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold mb-3">Recent Sessions</h3>
              <div className="space-y-2 text-xs text-slate-300">
                {sessions.map((s) => <p key={s.id}>{new Date(s.createdAt).toLocaleString()} [{s.status}]</p>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
