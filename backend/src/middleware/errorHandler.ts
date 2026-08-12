import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError, formatZodError, isPrismaKnownRequestError } from '../utils/helpers';
import { env } from '../config/env';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err instanceof ZodError) {
    return sendError(res, formatZodError(err), 400);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 'Invalid or expired token', 401);
  }

  if (isPrismaKnownRequestError(err)) {
    switch (err.code) {
      case 'P2002':
        return sendError(res, 'A record with this value already exists', 409);
      case 'P2003':
        return sendError(res, 'Resource cannot be changed because it is referenced by existing records', 409);
      case 'P2025':
        return sendError(res, 'Record not found', 404);
      case 'P2000':
      case 'P2005':
      case 'P2006':
      case 'P2011':
      case 'P2012':
      case 'P2013':
      case 'P2014':
        return sendError(res, 'Invalid request data', 400);
      default:
        return sendError(res, 'Database request failed', 500);
    }
  }

  console.error('Unhandled error:', err);

  const message = env.isProduction ? 'Internal server error' : err.message;
  return sendError(res, message, 500);
}

export function notFoundHandler(_req: Request, res: Response) {
  return sendError(res, 'Route not found', 404);
}
