import { Request, Response, NextFunction } from 'express';
import * as customerService from '../services/customerService';
import { sendSuccess } from '../utils/helpers';
import { getParamId } from '../utils/params';
import { customerSchema, customerQuerySchema, followUpSchema } from '../utils/validators';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = customerQuerySchema.parse(req.query);
    const result = await customerService.listCustomers(query);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customerService.getCustomer(getParamId(req.params.id));
    sendSuccess(res, customer);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = customerSchema.parse(req.body);
    const customer = await customerService.createCustomer(data);
    sendSuccess(res, customer, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = customerSchema.parse(req.body);
    const customer = await customerService.updateCustomer(getParamId(req.params.id), data);
    sendSuccess(res, customer);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await customerService.deleteCustomer(getParamId(req.params.id));
    sendSuccess(res, { message: 'Customer deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function addFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const data = followUpSchema.parse(req.body);
    const followUp = await customerService.addFollowUp(
      getParamId(req.params.id),
      data.note,
      data.followUpDate,
      req.user!.userId
    );
    sendSuccess(res, followUp, 201);
  } catch (err) {
    next(err);
  }
}

export async function getFollowUps(req: Request, res: Response, next: NextFunction) {
  try {
    const followUps = await customerService.getFollowUps(getParamId(req.params.id));
    sendSuccess(res, followUps);
  } catch (err) {
    next(err);
  }
}
