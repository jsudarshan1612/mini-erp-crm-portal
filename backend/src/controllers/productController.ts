import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/productService';
import { sendSuccess } from '../utils/helpers';
import { getParamId } from '../utils/params';
import { productSchema, productQuerySchema, stockMovementSchema, paginationSchema } from '../utils/validators';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = productQuerySchema.parse(req.query);
    const result = await productService.listProducts(query);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getProduct(getParamId(req.params.id));
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = productSchema.parse(req.body);
    const product = await productService.createProduct(data);
    sendSuccess(res, product, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = productSchema.parse(req.body);
    const product = await productService.updateProduct(getParamId(req.params.id), data);
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.deleteProduct(getParamId(req.params.id));
    sendSuccess(res, { message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function addStock(req: Request, res: Response, next: NextFunction) {
  try {
    const data = stockMovementSchema.parse(req.body);
    const movement = await productService.addStockMovement(
      getParamId(req.params.id),
      data.quantity,
      data.type,
      data.reason,
      req.user!.userId
    );
    sendSuccess(res, movement, 201);
  } catch (err) {
    next(err);
  }
}

export async function getStockMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const movements = await productService.getStockMovements(getParamId(req.params.id));
    sendSuccess(res, movements);
  } catch (err) {
    next(err);
  }
}

export async function listAllMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await productService.listAllStockMovements(page, limit);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await productService.getCategories();
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}
