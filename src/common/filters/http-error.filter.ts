import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
@Injectable()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Registros internos controlados: preservar trazas y contexto del error
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(
        `[HttpErrorFilter] Internal Server Error en ${request.method} ${request.url}:`,
        exception,
      );
    }

    // La respuesta pública no entrega traza, consulta SQL ni variables de entorno
    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : exception instanceof HttpException
            ? exception.getResponse()
            : 'Internal server error',
    });
  }
}
