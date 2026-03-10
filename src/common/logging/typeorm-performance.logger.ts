import { Logger as NestLogger } from '@nestjs/common';
import { Logger, QueryRunner } from 'typeorm';

export class TypeOrmPerformanceLogger implements Logger {
  private readonly logger = new NestLogger('TypeORM');

  logQuery(_query: string, _parameters?: unknown[], _queryRunner?: QueryRunner): void {}

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: unknown[],
    _queryRunner?: QueryRunner,
  ): void {
    this.logger.error(
      `Query error: ${this.stringifyError(error)} | query=${query} | params=${this.safeJson(parameters)}`,
    );
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: unknown[],
    _queryRunner?: QueryRunner,
  ): void {
    this.logger.warn(
      `Slow query ${time}ms | query=${query} | params=${this.safeJson(parameters)}`,
    );
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner): void {
    this.logger.log(message);
  }

  logMigration(message: string, _queryRunner?: QueryRunner): void {
    this.logger.log(message);
  }

  log(level: 'log' | 'info' | 'warn', message: unknown, _queryRunner?: QueryRunner): void {
    const text = String(message);
    if (level === 'warn') {
      this.logger.warn(text);
      return;
    }
    this.logger.log(text);
  }

  private stringifyError(error: string | Error): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    return String(error);
  }

  private safeJson(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable]';
    }
  }
}

