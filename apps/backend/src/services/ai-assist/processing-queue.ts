type Job<T = any> = {
  key: string;
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

export class AIProcessingQueue {
  private queue: Array<Job> = [];
  private activeKeys = new Set<string>();
  private running = false;

  enqueue<T>(key: string, run: () => Promise<T>): Promise<T> {
    if (this.activeKeys.has(key)) {
      return Promise.reject(new Error('Duplicate processing job rejected'));
    }

    this.activeKeys.add(key);
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ key, run, resolve, reject });
      this.kick();
    });
  }

  private async kick(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (this.queue.length) {
      const next = this.queue.shift();
      if (!next) continue;
      try {
        const value = await next.run();
        next.resolve(value);
      } catch (error) {
        next.reject(error);
      } finally {
        this.activeKeys.delete(next.key);
      }
    }

    this.running = false;
  }
}

export const aiProcessingQueue = new AIProcessingQueue();
