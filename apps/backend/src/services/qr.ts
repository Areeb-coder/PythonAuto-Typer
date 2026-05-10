import QRCode from 'qrcode';
import { nanoid } from 'nanoid';
import { logDebug, logError } from '../logger.js';

interface PairingSession {
  code: string;
  qrCode: string;
  expiresAt: Date;
  backendUrl: string;
  pairingUrl: string;
}

export class QRService {
  private activePairingSessions: Map<string, PairingSession> = new Map();
  private sessionTimeout = 10 * 60 * 1000; // 10 minutes

  async generatePairingQR(backendUrl: string, frontendUrl?: string): Promise<PairingSession> {
    try {
      const pairingCode = nanoid(8).toUpperCase();
      const expiresAt = new Date(Date.now() + this.sessionTimeout);

      // Use a browser-openable link so phone cameras can open it directly.
      const baseFrontend = frontendUrl || 'http://localhost:3000';
      const pairingLink = `${baseFrontend.replace(/\/$/, '')}/pairing?code=${encodeURIComponent(pairingCode)}&backend=${encodeURIComponent(backendUrl)}&v=${Date.now()}`;
      const qrCodeData = pairingLink;
      const qrCode = await QRCode.toDataURL(qrCodeData);

      const session: PairingSession = {
        code: pairingCode,
        qrCode,
        expiresAt,
        backendUrl,
        pairingUrl: pairingLink,
      };

      this.activePairingSessions.set(pairingCode, session);

      // Auto-cleanup after expiration
      setTimeout(() => {
        this.activePairingSessions.delete(pairingCode);
        logDebug('Pairing session expired', { code: pairingCode });
      }, this.sessionTimeout);

      logDebug('QR code generated', { code: pairingCode });

      return session;
    } catch (error) {
      logError('Failed to generate QR code', error as Error);
      throw error;
    }
  }

  validatePairingCode(code: string): boolean {
    const session = this.activePairingSessions.get(code);
    if (!session) return false;
    if (new Date() > session.expiresAt) {
      this.activePairingSessions.delete(code);
      return false;
    }
    return true;
  }

  getPairingSession(code: string): PairingSession | null {
    return this.activePairingSessions.get(code) || null;
  }

  invalidatePairingCode(code: string): void {
    this.activePairingSessions.delete(code);
    logDebug('Pairing code invalidated', { code });
  }
}

export const qrService = new QRService();
