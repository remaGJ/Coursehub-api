import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
  ParseIntPipe,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { of } from 'rxjs';
import type { Request, Response, NextFunction } from 'express';
import { RequestLoggerMiddleware } from '../src/common/middleware/request-logger.middleware.js';
import { HttpErrorFilter } from '../src/common/filters/http-error.filter.js';
import { TimingInterceptor } from '../src/common/interceptors/timing.interceptor.js';

describe('Práctica Guiada: Middleware, Validation/ParseInt Pipe, Filter e Interceptor', () => {
  let loggerMiddleware: RequestLoggerMiddleware;
  let errorFilter: HttpErrorFilter;
  let timingInterceptor: TimingInterceptor;
  let parseIntPipe: ParseIntPipe;

  beforeEach(() => {
    loggerMiddleware = new RequestLoggerMiddleware();
    errorFilter = new HttpErrorFilter();
    timingInterceptor = new TimingInterceptor();
    parseIntPipe = new ParseIntPipe();
    vi.restoreAllMocks();
  });

  const createMockHost = (url: string, method: string = 'GET') => {
    let responseStatus: number = 200;
    let responseBody: any = null;

    const mockResponse = {
      status: vi.fn((code: number) => {
        responseStatus = code;
        return {
          json: vi.fn((body: any) => {
            responseBody = body;
            return body;
          }),
        };
      }),
    };

    const mockRequest = {
      url,
      method,
      originalUrl: url,
      headers: { authorization: 'Bearer secret-jwt-token' },
      body: { password: 'secret-password' },
    };

    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as unknown as Response,
        getRequest: () => mockRequest as unknown as Request,
      }),
    };

    return {
      host: host as any,
      getStatus: () => responseStatus,
      getBody: () => responseBody,
      mockRequest,
      mockResponse,
    };
  };

  it('1. Registro seguro: Verifica método, ruta, estado y duración sin filtrar cabeceras ni cuerpos', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    let finishListener: () => void = () => {};

    const req = {
      method: 'GET',
      originalUrl: '/api/v1/courses',
      headers: { authorization: 'Bearer super-secret-jwt' },
      body: { token: 'secret-auth-token' },
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === 'finish') finishListener = cb;
      }),
    } as unknown as Response;

    const next: NextFunction = vi.fn();

    loggerMiddleware.use(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    finishListener();

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logged = consoleLogSpy.mock.calls[0][0];

    expect(logged).toMatchObject({
      method: 'GET',
      path: '/api/v1/courses',
      status: 200,
    });
    expect(typeof logged.durationMs).toBe('number');

    // Verificar que nunca se registran Authorization, tokens ni body
    const loggedJson = JSON.stringify(logged);
    expect(loggedJson).not.toContain('super-secret-jwt');
    expect(loggedJson).not.toContain('secret-auth-token');
    expect(logged).not.toHaveProperty('authorization');
    expect(logged).not.toHaveProperty('body');
  });

  it('2. TimingInterceptor: Mide tiempo de respuesta sin registrar cuerpos sensibles', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ body: { password: 'user-secret' } }),
      }),
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: () => of({ success: true }),
    };

    const stream = timingInterceptor.intercept(mockContext, mockHandler);

    await new Promise<void>((resolve) => {
      stream.subscribe({
        complete: () => resolve(),
      });
    });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logged = consoleLogSpy.mock.calls[0][0];
    expect(logged).toHaveProperty('durationMs');
    expect(typeof logged.durationMs).toBe('number');
    expect(logged).not.toHaveProperty('body');
    expect(logged).not.toHaveProperty('password');
  });

  it('3. Provoca un 400 Bad Request: ParseIntPipe rechaza valor no numérico y Filter da forma coherente', async () => {
    const mockCtx = createMockHost('/courses/abc', 'GET');

    // ParseIntPipe debe rechazar 'abc'
    let errorCaught: any;
    try {
      await parseIntPipe.transform('abc', { type: 'param', metatype: Number });
    } catch (err) {
      errorCaught = err;
    }

    expect(errorCaught).toBeInstanceOf(BadRequestException);

    // HttpErrorFilter captura el 400
    errorFilter.catch(errorCaught, mockCtx.host);

    expect(mockCtx.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    const body = mockCtx.getBody();

    expect(body).toMatchObject({
      statusCode: 400,
      path: '/courses/abc',
    });
    expect(body.timestamp).toBeDefined();
    expect(body.message).toBeDefined();
  });

  it('4. Provoca un 404 Not Found: Filter global formatea el error coherentemente', () => {
    const mockCtx = createMockHost('/recurso-inexistente', 'GET');
    const notFoundException = new NotFoundException('Cannot GET /recurso-inexistente');

    errorFilter.catch(notFoundException, mockCtx.host);

    expect(mockCtx.getStatus()).toBe(HttpStatus.NOT_FOUND);
    const body = mockCtx.getBody();

    expect(body).toMatchObject({
      statusCode: 404,
      path: '/recurso-inexistente',
    });
    expect(body.timestamp).toBeDefined();
    expect(body.message).toBeDefined();
  });

  it('5. Provoca un Error Inesperado (500): Compara respuesta pública sanitizada vs registros internos', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockCtx = createMockHost('/practice/error-500', 'GET');

    // Error crítico no controlado que contiene traza SQL y credenciales
    const unexpectedError = new Error(
      'Fallo crítico en base de datos: SELECT password_hash FROM users WHERE admin = true - Connection refused at postgres://admin:super_secret@localhost:5432',
    );

    errorFilter.catch(unexpectedError, mockCtx.host);

    // A) Respuesta PÚBLICA: No filtra trazas, consultas SQL ni variables de entorno
    expect(mockCtx.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = mockCtx.getBody();

    expect(body).toEqual({
      statusCode: 500,
      path: '/practice/error-500',
      timestamp: expect.any(String),
      message: 'Internal server error',
    });

    const publicJson = JSON.stringify(body);
    expect(publicJson).not.toContain('SELECT password_hash');
    expect(publicJson).not.toContain('super_secret');
    expect(publicJson).not.toContain('postgres://');

    // B) Registro INTERNO: Preserva los detalles completos para el equipo técnico
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const [logMessage, loggedError] = consoleErrorSpy.mock.calls[0];
    expect(logMessage).toContain('[HttpErrorFilter] Internal Server Error');
    expect(loggedError).toBe(unexpectedError);
    expect((loggedError as Error).message).toContain('SELECT password_hash');
    expect((loggedError as Error).message).toContain('super_secret');
  });
});
