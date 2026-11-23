import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();
    res.on('finish', () => {
      console.log({
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });
    next();
  }
}
