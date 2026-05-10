'use client';

import { create } from 'zustand';
import type { ConnectionState, Device, Settings } from '@smart-typer/shared';

interface ConnectionStore {
  state: ConnectionState;
  isConnected: boolean;
  latency: number;
  lastActivityTime: string | null;
  
  setState: (state: ConnectionState) => void;
  setLatency: (latency: number) => void;
  setLastActivity: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  state: 'disconnected',
  isConnected: false,
  latency: 0,
  lastActivityTime: null,

  setState: (state) =>
    set({
      state,
      isConnected: state === 'connected',
    }),

  setLatency: (latency) => set({ latency }),

  setLastActivity: () =>
    set({ lastActivityTime: new Date().toISOString() }),
}));

interface SettingsStore {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  
  setSettings: (settings: Settings) => void;
  updateSettings: (updates: Partial<Settings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  setSettings: (settings) => set({ settings, error: null }),

  updateSettings: (updates) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...updates } : null,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));

interface QueueStore {
  queueLength: number;
  isTyping: boolean;
  currentText: string | null;
  
  setQueueLength: (length: number) => void;
  setIsTyping: (isTyping: boolean) => void;
  setCurrentText: (text: string | null) => void;
}

export const useQueueStore = create<QueueStore>((set) => ({
  queueLength: 0,
  isTyping: false,
  currentText: null,

  setQueueLength: (queueLength) => set({ queueLength }),

  setIsTyping: (isTyping) => set({ isTyping }),

  setCurrentText: (currentText) => set({ currentText }),
}));

interface DeviceStore {
  devices: Device[];
  authenticatedDevice: Device | null;
  sessionToken: string | null;
  
  setDevices: (devices: Device[]) => void;
  setAuthenticatedDevice: (device: Device | null, token: string | null) => void;
  addDevice: (device: Device) => void;
  removeDevice: (deviceId: string) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: [],
  authenticatedDevice: null,
  sessionToken: null,

  setDevices: (devices) => set({ devices }),

  setAuthenticatedDevice: (device, token) =>
    set({
      authenticatedDevice: device,
      sessionToken: token,
    }),

  addDevice: (device) =>
    set((state) => ({
      devices: [device, ...state.devices],
    })),

  removeDevice: (deviceId) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== deviceId),
    })),
}));
