import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from 'src/redis/providers/redis.service';
import { PaymentsService } from 'src/payments/providers/payments.service';

type CheckStatus = 'up' | 'down';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly paymentsService: PaymentsService,
  ) {}

  getLiveness() {
    return {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    const checks: {
      db: CheckStatus;
      redis: CheckStatus;
      paymentsProvider: CheckStatus;
    } = {
      db: 'down',
      redis: 'down',
      paymentsProvider: this.paymentsService ? 'up' : 'down',
    };

    try {
      await this.dataSource.query('SELECT 1');
      checks.db = 'up';
    } catch {
      checks.db = 'down';
    }

    try {
      const pong = await this.redisService.ping();
      checks.redis = pong === 'PONG' ? 'up' : 'down';
    } catch {
      checks.redis = 'down';
    }

    return {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
