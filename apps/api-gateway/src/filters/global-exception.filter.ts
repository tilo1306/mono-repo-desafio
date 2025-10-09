import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof RpcException) {
      const rpcError = exception.getError();
      if (typeof rpcError === 'object' && rpcError !== null) {
        status =
          (rpcError as any).statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
        message = (rpcError as any).message || 'Microservice error';
      } else {
        message = String(rpcError);
      }
    } else if (
      exception &&
      typeof exception === 'object' &&
      (exception as any).statusCode &&
      (exception as any).message
    ) {
      status = (exception as any).statusCode;
      message = (exception as any).message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message} | date: ${new Date().toISOString()}`,
        exception.stack,
      );
    }

    this.logger.error(
      `Exception caught: ${message} | date: ${new Date().toISOString()}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
