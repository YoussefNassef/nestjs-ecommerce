import { Injectable } from '@nestjs/common';

interface RequestMetricInput {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
}

@Injectable()
export class MetricsService {
  private readonly startedAtMs = Date.now();
  private readonly durationBuckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000];

  private readonly requestCounter = new Map<string, number>();
  private readonly requestDurationSum = new Map<string, number>();
  private readonly requestDurationCount = new Map<string, number>();
  private readonly histogramBucketCounter = new Map<string, number>();

  recordHttpRequest(input: RequestMetricInput): void {
    const method = this.normalizeLabel(input.method);
    const route = this.normalizeRoute(input.route);
    const statusCode = String(input.statusCode);
    const durationMs = Math.max(0, Number(input.durationMs) || 0);
    const key = this.buildBaseKey(method, route, statusCode);

    this.incrementMap(this.requestCounter, key, 1);
    this.incrementMap(this.requestDurationSum, key, durationMs / 1000);
    this.incrementMap(this.requestDurationCount, key, 1);

    for (const bucket of this.durationBuckets) {
      if (durationMs <= bucket) {
        this.incrementMap(
          this.histogramBucketCounter,
          `${key}|le:${String(bucket / 1000)}`,
          1,
        );
      }
    }
    this.incrementMap(this.histogramBucketCounter, `${key}|le:+Inf`, 1);
  }

  toPrometheusText(): string {
    const lines: string[] = [];

    lines.push('# HELP process_uptime_seconds Process uptime in seconds.');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${this.formatNumber((Date.now() - this.startedAtMs) / 1000)}`);

    lines.push('# HELP http_requests_total Total number of HTTP requests.');
    lines.push('# TYPE http_requests_total counter');
    for (const [key, value] of this.requestCounter.entries()) {
      const labels = this.keyToLabels(key);
      lines.push(
        `http_requests_total{method="${labels.method}",route="${labels.route}",status_code="${labels.statusCode}"} ${Math.trunc(value)}`,
      );
    }

    lines.push(
      '# HELP http_request_duration_seconds HTTP request duration in seconds.',
    );
    lines.push('# TYPE http_request_duration_seconds histogram');
    for (const [key, value] of this.histogramBucketCounter.entries()) {
      const labels = this.bucketKeyToLabels(key);
      lines.push(
        `http_request_duration_seconds_bucket{method="${labels.method}",route="${labels.route}",status_code="${labels.statusCode}",le="${labels.le}"} ${Math.trunc(value)}`,
      );
    }
    for (const [key, value] of this.requestDurationSum.entries()) {
      const labels = this.keyToLabels(key);
      lines.push(
        `http_request_duration_seconds_sum{method="${labels.method}",route="${labels.route}",status_code="${labels.statusCode}"} ${this.formatNumber(value)}`,
      );
    }
    for (const [key, value] of this.requestDurationCount.entries()) {
      const labels = this.keyToLabels(key);
      lines.push(
        `http_request_duration_seconds_count{method="${labels.method}",route="${labels.route}",status_code="${labels.statusCode}"} ${Math.trunc(value)}`,
      );
    }

    return `${lines.join('\n')}\n`;
  }

  private buildBaseKey(method: string, route: string, statusCode: string): string {
    return `method:${method}|route:${route}|status_code:${statusCode}`;
  }

  private keyToLabels(key: string): {
    method: string;
    route: string;
    statusCode: string;
  } {
    const parts = key.split('|');
    const method = parts[0]?.replace('method:', '') ?? 'UNKNOWN';
    const route = parts[1]?.replace('route:', '') ?? 'unknown';
    const statusCode = parts[2]?.replace('status_code:', '') ?? '0';
    return { method, route, statusCode };
  }

  private bucketKeyToLabels(key: string): {
    method: string;
    route: string;
    statusCode: string;
    le: string;
  } {
    const [baseKey, lePart] = key.split('|le:');
    const base = this.keyToLabels(baseKey ?? '');
    return { ...base, le: lePart ?? '+Inf' };
  }

  private normalizeRoute(route: string): string {
    const noQuery = (route || '/').split('?')[0] || '/';
    return noQuery
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':uuid')
      .replace(/\/\d+(?=\/|$)/g, '/:id');
  }

  private normalizeLabel(value: string): string {
    const normalized = (value || 'UNKNOWN').trim().toUpperCase();
    return normalized.length ? normalized : 'UNKNOWN';
  }

  private incrementMap(map: Map<string, number>, key: string, value: number): void {
    map.set(key, (map.get(key) ?? 0) + value);
  }

  private formatNumber(value: number): string {
    if (!Number.isFinite(value)) {
      return '0';
    }
    return Number(value.toFixed(6)).toString();
  }
}

