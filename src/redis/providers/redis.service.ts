import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

    this.client = createClient({ url: redisUrl });

    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    await this.ensureConnected();
    const value = await this.client.get(key);
    if (!value) {
      return null;
    }
    return JSON.parse(value) as T;
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    await this.ensureConnected();
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, payload, { EX: ttlSeconds });
      return;
    }
    await this.client.set(key, payload);
  }

  async del(key: string): Promise<number> {
    await this.ensureConnected();
    return this.client.del(key);
  }

  async increment(key: string): Promise<number> {
    await this.ensureConnected();
    return this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    await this.ensureConnected();
    return this.client.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    await this.ensureConnected();
    return this.client.ttl(key);
  }

  async ping(): Promise<string> {
    await this.ensureConnected();
    return this.client.ping();
  }

  async deleteByPattern(pattern: string): Promise<number> {
    await this.ensureConnected();
    const keys: string[] = [];

    for await (const key of this.client.scanIterator({ MATCH: pattern })) {
      if (Array.isArray(key)) {
        keys.push(...key);
      } else {
        keys.push(key);
      }
    }

    if (keys.length === 0) {
      return 0;
    }

    return this.client.del(keys);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}
