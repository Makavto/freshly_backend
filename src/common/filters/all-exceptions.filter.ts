import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { MulterError } from 'multer';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const payload = this.toPayload(exception);
    if (payload.statusCode >= 500) {
      this.logger.error(exception);
    }
    response.status(payload.statusCode).json(payload);
  }

  private toPayload(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        return { statusCode, message: body, error: exception.name };
      }
      const record = body as Record<string, unknown>;
      return {
        statusCode,
        message: (record.message as string | string[]) ?? exception.message,
        error: (record.error as string) ?? exception.name,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Resource already exists',
          error: 'Conflict',
        };
      }
      if (exception.code === 'P2025') {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          error: 'Not Found',
        };
      }
    }

    if (exception instanceof MulterError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
        error: 'Bad Request',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
