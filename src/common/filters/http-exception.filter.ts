import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (this.extractMessage(exceptionResponse) ?? exception.message);

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  private extractMessage(response: unknown): string | string[] | undefined {
    if (!response || typeof response !== 'object') {
      return undefined;
    }

    const maybeMessage = (response as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' || Array.isArray(maybeMessage)) {
      return maybeMessage;
    }

    return undefined;
  }
}
