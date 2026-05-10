// Connection States
export type ConnectionState = 
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'backend_offline';

// Socket Events
export interface SocketEventMap {
  // Connection events
  'connect': void;
  'disconnect': void;
  'reconnect': void;
  'reconnect_error': Error;
  
  // Device pairing
  'pair:request': { deviceId: string; deviceName: string };
  'pair:success': { sessionToken: string; pairedAt: string };
  'pair:error': { error: string };
  'pair:qr': { qrCode: string; pairingCode: string };
  
  // Typing control
  'type:send': { text: string; speed?: number };
  'type:status': TypingStatus;
  'type:stop': void;
  'type:queue': QueueItem[];
  
  // Settings
  'settings:get': Settings;
  'settings:update': Partial<Settings>;
  
  // Status
  'status:health': HealthStatus;
  'status:engine': EngineStatus;
  
  // Logging
  'log:message': LogMessage;
  
  // Device management
  'device:list': Device[];
  'device:revoke': { deviceId: string };
}

// Core Types
export interface Device {
  id: string;
  name: string;
  type: 'phone' | 'tablet' | 'desktop';
  trusted: boolean;
  lastSeen: string;
  pairedAt: string;
  sessionToken: string;
}

export interface Settings {
  typingSpeed: number; // WPM or chars/sec
  reconnectBehavior: 'automatic' | 'manual';
  backendIp: string;
  websocketUrl: string;
  theme: 'light' | 'dark' | 'system';
  typingDelay: number; // ms
  emergencyStopKey: string;
  autoReconnect: boolean;
  reconnectInterval: number; // ms
  maxReconnectAttempts: number;
  aiMode?: 'solve' | 'explain' | 'simplify' | 'rewrite' | 'answer-only';
  ocrProvider?: 'paddle' | 'huggingface';
  preprocessingQuality?: 'fast' | 'balanced' | 'high';
  captureResolution?: 'low' | 'medium' | 'high';
}

export interface TypingStatus {
  state: 'idle' | 'typing' | 'paused' | 'error' | 'stopped';
  currentText?: string;
  queueLength: number;
  charsTyped: number;
  estimatedTimeRemaining: number; // seconds
  error?: string;
  speed: number;
  progress: number; // 0-100
}

export interface EngineStatus {
  running: boolean;
  queueLength: number;
  lastActivity: string;
  uptime: number; // seconds
  processId?: number;
  speed: number;
  typedTotal: number;
}

export interface QueueItem {
  id: string;
  text: string;
  status: 'pending' | 'typing' | 'completed' | 'error';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  speed?: number;
}

export interface HealthStatus {
  backend: boolean;
  database: boolean;
  socket: boolean;
  typingEngine: boolean;
  uptime: number;
  timestamp: string;
  latency: number;
}

export interface LogMessage {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'backend' | 'websocket' | 'typing' | 'device' | 'reconnect' | 'queue' | 'pairing' | 'ocr' | 'ai' | 'capture';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// API Request/Response Types
export interface PairingResponse {
  success: boolean;
  sessionToken: string;
  device: Device;
  settings: Settings;
}

export interface TypeRequest {
  text: string;
  speed?: number;
  deviceId: string;
}

export interface TypeResponse {
  success: boolean;
  queueId: string;
  estimatedTime: number;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, any>;
}

// Pairing related
export interface PairingData {
  pairingCode: string;
  qrCode: string;
  expiresAt: string;
  backendUrl: string;
}

export interface SessionData {
  sessionToken: string;
  deviceId: string;
  deviceName: string;
  pairedAt: string;
  lastActivity: string;
}
