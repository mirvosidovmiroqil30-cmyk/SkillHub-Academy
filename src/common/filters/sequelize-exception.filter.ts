import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  UniqueConstraintError,
  ValidationError,
  ForeignKeyConstraintError,
} from 'sequelize';

@Catch(UniqueConstraintError, ValidationError, ForeignKeyConstraintError)
export class SequelizeExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | UniqueConstraintError
      | ValidationError
      | ForeignKeyConstraintError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode: number;
    let message: string;

    if (exception instanceof UniqueConstraintError) {
      statusCode = HttpStatus.CONFLICT;
      const fields = exception.errors.map((e) => e.path).join(', ');
      message = `Duplicate value for: ${fields}`;
    } else if (exception instanceof ForeignKeyConstraintError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Referenced resource does not exist';
    } else {
      // ValidationError
      statusCode = HttpStatus.BAD_REQUEST;
      message = exception.errors.map((e) => e.message).join(', ');
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
