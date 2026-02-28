import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, map } from 'rxjs';

type ApiSuccessResponse<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: response.statusCode,
        message: this.resolveMessage(data, request.method),
        data,
        timestamp: new Date().toISOString(),
        path: request.originalUrl,
      })),
    );
  }

  private resolveMessage(data: T, method: string): string {
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const value = (data as Record<string, unknown>).message;
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    if (method === 'POST') {
      return 'Created successfully';
    }
    if (method === 'PATCH' || method === 'PUT') {
      return 'Updated successfully';
    }
    if (method === 'DELETE') {
      return 'Deleted successfully';
    }

    return 'Request successful';
  }
}
