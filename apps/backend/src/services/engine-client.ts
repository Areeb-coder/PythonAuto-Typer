import net from 'node:net';

const ENGINE_HOST = process.env.ENGINE_HOST || process.env.PYTHON_ENGINE_HOST || '127.0.0.1';
const ENGINE_PORT = parseInt(process.env.ENGINE_PORT || process.env.TYPING_ENGINE_PORT || '5000', 10);

type EngineCommand =
  | { type: 'type'; task_id: string; text: string; speed?: number }
  | { type: 'status' }
  | { type: 'stop' }
  | { type: 'clear' };

export type EngineResponse = {
  success: boolean;
  message?: string;
  error?: string;
  status?: {
    running: boolean;
    is_typing: boolean;
    queue_length: number;
    total_characters: number;
    uptime: number;
  };
};

function sendCommand(command: EngineCommand, timeoutMs = 3000): Promise<EngineResponse> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      fn();
    };

    socket.setTimeout(timeoutMs);

    socket.connect(ENGINE_PORT, ENGINE_HOST, () => {
      socket.write(JSON.stringify(command));
    });

    socket.on('data', (data) => {
      finish(() => {
        try {
          const parsed = JSON.parse(data.toString('utf-8')) as EngineResponse;
          resolve(parsed);
        } catch {
          reject(new Error('Invalid response from typing engine'));
        }
      });
    });

    socket.on('timeout', () => finish(() => reject(new Error('Typing engine request timed out'))));
    socket.on('error', (err) => finish(() => reject(err)));
    socket.on('close', () => {
      if (!done) {
        finish(() => reject(new Error('Typing engine closed connection')));
      }
    });
  });
}

export const engineClient = {
  async queueText(taskId: string, text: string, speed?: number): Promise<EngineResponse> {
    return sendCommand({ type: 'type', task_id: taskId, text, speed });
  },
  async stop(): Promise<EngineResponse> {
    return sendCommand({ type: 'stop' });
  },
  async clear(): Promise<EngineResponse> {
    return sendCommand({ type: 'clear' });
  },
  async status(): Promise<EngineResponse> {
    return sendCommand({ type: 'status' });
  },
};
