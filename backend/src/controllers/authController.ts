import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { sendSuccess } from '../utils/helpers';
import { loginSchema, registerSchema } from '../utils/validators';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    const user = await authService.register(data.name, data.email, data.password, data.role);
    sendSuccess(res, user, 201);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.userId);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await authService.listUsers();
    sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}
