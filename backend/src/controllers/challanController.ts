import { Request, Response, NextFunction } from 'express';
import * as challanService from '../services/challanService';
import { sendSuccess } from '../utils/helpers';
import { getParamId } from '../utils/params';
import { challanSchema, challanQuerySchema } from '../utils/validators';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = challanQuerySchema.parse(req.query);
    const result = await challanService.listChallans(query);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const challan = await challanService.getChallan(getParamId(req.params.id));
    sendSuccess(res, challan);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = challanSchema.parse(req.body);
    const challan = await challanService.createChallan(
      data.customerId,
      data.items,
      req.user!.userId
    );
    sendSuccess(res, challan, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = challanSchema.parse(req.body);
    const challan = await challanService.updateChallan(
      getParamId(req.params.id),
      data.customerId,
      data.items
    );
    sendSuccess(res, challan);
  } catch (err) {
    next(err);
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
  try {
    const challan = await challanService.confirmChallan(getParamId(req.params.id), req.user!.userId);
    sendSuccess(res, challan);
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const challan = await challanService.cancelChallan(getParamId(req.params.id));
    sendSuccess(res, challan);
  } catch (err) {
    next(err);
  }
}
