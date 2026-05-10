'use client';

import axios from 'axios';

function resolveApiBaseUrl(): string {
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

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});

export async function getHealth() {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Failed to get health:', error);
    return null;
  }
}

export async function getNetworkInfo() {
  try {
    const response = await api.get('/api/network-info');
    return response.data as { success: boolean; host: string | null };
  } catch (error) {
    console.error('Failed to get network info:', error);
    return { success: false, host: null };
  }
}

export async function generateQR(backendUrl: string, frontendUrl?: string) {
  try {
    const response = await api.post('/api/pair/generate-qr', {
      backendUrl,
      frontendUrl,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to generate QR:', error);
    throw error;
  }
}

export async function getDevices() {
  try {
    const response = await api.get('/api/devices');
    return response.data;
  } catch (error) {
    console.error('Failed to get devices:', error);
    throw error;
  }
}

export async function revokeDevice(deviceId: string) {
  try {
    const response = await api.delete(`/api/devices/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to revoke device:', error);
    throw error;
  }
}

export async function getSettings() {
  try {
    const response = await api.get('/api/settings');
    return response.data;
  } catch (error) {
    console.error('Failed to get settings:', error);
    throw error;
  }
}

export async function updateSettings(settings: any) {
  try {
    const response = await api.patch('/api/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
}

export async function getLogs(params?: any) {
  try {
    const response = await api.get('/api/logs', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to get logs:', error);
    throw error;
  }
}

export async function getEngineStatus() {
  try {
    const response = await api.get('/api/engine/status');
    return response.data;
  } catch (error) {
    console.error('Failed to get engine status:', error);
    throw error;
  }
}
