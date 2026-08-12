import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService';
import { sendSuccess } from '../utils/helpers';

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getDashboardStats();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
