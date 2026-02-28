import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ApiErrorResponse = {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse) {
        const parsed = exceptionResponse as Record<string, unknown>;
        const parsedMessage = parsed.message;

        if (Array.isArray(parsedMessage)) {
          errors = parsedMessage.map((item) => String(item));
          message = errors[0] ?? message;
        } else if (typeof parsedMessage === 'string') {
          message = parsedMessage;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const payload: ApiErrorResponse = {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    };

    if (errors && errors.length > 0) {
      payload.errors = errors;
    }

    response.status(statusCode).json(payload);
  }
}
