import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function sendError(res: Response, message: string, statusCode = 500) {
  return res.status(statusCode).json({ success: false, message });
}

export function formatZodError(error: ZodError): string {
  return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
}

export function excludePassword<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password: _, ...rest } = user;
  return rest;
}

export function isPrismaKnownRequestError(
  error: unknown,
  code?: string
): error is Prisma.PrismaClientKnownRequestError {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return code ? error.code === code : true;
}

export function isPrismaUniqueConstraintError(error: unknown, field?: string): boolean {
  if (!isPrismaKnownRequestError(error, 'P2002')) return false;
  if (!field) return true;

  const target = error.meta?.target;
  if (typeof target === 'string') return target.includes(field);
  return Array.isArray(target) && target.includes(field);
}

export function isPrismaForeignKeyError(error: unknown): boolean {
  return isPrismaKnownRequestError(error, 'P2003');
}
