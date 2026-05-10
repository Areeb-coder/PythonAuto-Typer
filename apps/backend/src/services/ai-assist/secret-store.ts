import crypto from 'node:crypto';
import { getPrisma } from '../../database.js';

const SECRET = process.env.AI_KEY_SECRET || 'dev-only-secret-change-me';

function getKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(value: string): string {
  const iv = crypto.randomBytes(12);
  const key = getKey(SECRET);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  const key = getKey(SECRET);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export class AISecretStore {
  private prisma = getPrisma() as any;

  async setGeminiKey(rawKey: string): Promise<void> {
    const clean = rawKey.trim();
    const hint = clean.length <= 6 ? '***' : `***${clean.slice(-4)}`;
    const cipher = encrypt(clean);
    const current = await this.prisma.aISettings.findFirst();

    if (!current) {
      await this.prisma.aISettings.create({
        data: {
          geminiApiKeyCipher: cipher,
          geminiApiKeyHint: hint,
        },
      });
      return;
    }

    await this.prisma.aISettings.update({
      where: { id: current.id },
      data: {
        geminiApiKeyCipher: cipher,
        geminiApiKeyHint: hint,
      },
    });
  }

  async getGeminiKey(): Promise<string | null> {
    const row = await this.prisma.aISettings.findFirst();
    if (!row?.geminiApiKeyCipher) return null;
    try {
      return decrypt(row.geminiApiKeyCipher);
    } catch {
      return null;
    }
  }

  async getGeminiKeyHint(): Promise<string | null> {
    const row = await this.prisma.aISettings.findFirst();
    return row?.geminiApiKeyHint ?? null;
  }
}

export const aiSecretStore = new AISecretStore();
