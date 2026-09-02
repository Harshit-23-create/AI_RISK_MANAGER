import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: (err as any).errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
      }
    });
    return;
  }

  const status = (err as any).status || (err as any).statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = (err as any).code || 'INTERNAL_ERROR';

  if (status >= 500) {
    logger.error(`[${status}] ${message}`, { error: err.stack, url: req.originalUrl });
  } else {
    logger.warn(`[${status}] ${message}`, { url: req.originalUrl });
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message
    }
  });
}

export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code: string = 'API_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}
