import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestLoggerMiddleware } from './request-logger.middleware.js';
import type { Request, Response, NextFunction } from 'express';

describe('RequestLoggerMiddleware', () => {
  let middleware: RequestLoggerMiddleware;

  beforeEach(() => {
    middleware = new RequestLoggerMiddleware();
    vi.restoreAllMocks();
  });

  it('should call next() and log method, path, status and duration on response finish', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    let finishCallback: () => void = () => {};
    const req = {
      method: 'GET',
      originalUrl: '/api/courses',
      headers: {
        authorization: 'Bearer secret-jwt-token',
      },
      body: { password: 'secretpassword' },
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === 'finish') {
          finishCallback = cb;
        }
      }),
    } as unknown as Response;

    const next: NextFunction = vi.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(consoleSpy).not.toHaveBeenCalled();

    // Simular el evento 'finish' al completar la respuesta
    finishCallback();

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const loggedData = consoleSpy.mock.calls[0][0];

    expect(loggedData).toMatchObject({
      method: 'GET',
      path: '/api/courses',
      status: 200,
    });
    expect(typeof loggedData.durationMs).toBe('number');

    // Verificar que nunca se registran headers sensibles ni cuerpos
    expect(loggedData).not.toHaveProperty('authorization');
    expect(loggedData).not.toHaveProperty('headers');
    expect(loggedData).not.toHaveProperty('body');
    expect(loggedData).not.toHaveProperty('password');
  });

  it('should use req.url if req.originalUrl is not present', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    let finishCallback: () => void = () => {};

    const req = {
      method: 'POST',
      url: '/fallback-url',
    } as unknown as Request;

    const res = {
      statusCode: 201,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === 'finish') finishCallback = cb;
      }),
    } as unknown as Response;

    const next: NextFunction = vi.fn();

    middleware.use(req, res, next);
    finishCallback();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/fallback-url',
        status: 201,
      }),
    );
  });
});
