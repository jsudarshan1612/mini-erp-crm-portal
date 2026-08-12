import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { sendError } from '../utils/helpers';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = verifyToken(token);
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
}
