import api from './api';
import { ApiResponse, Product, StockMovement, Pagination } from '../types';

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export const productService = {
  async list(params: ProductQuery = {}) {
    const { data } = await api.get<
      ApiResponse<{ products: Product[]; pagination: Pagination }>
    >('/products', {
      params: { ...params, lowStock: params.lowStock ? 'true' : undefined },
    });
    return data.data!;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data!;
  },

  async create(payload: Partial<Product>) {
    const { data } = await api.post<ApiResponse<Product>>('/products', payload);
    return data.data!;
  },

  async update(id: string, payload: Partial<Product>) {
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return data.data!;
  },

  async remove(id: string) {
    await api.delete(`/products/${id}`);
  },

  async getCategories() {
    const { data } = await api.get<ApiResponse<string[]>>('/products/categories/list');
    return data.data!;
  },
};

export const stockService = {
  async addStock(productId: string, quantity: number, type: 'IN' | 'OUT', reason: string) {
    const { data } = await api.post<ApiResponse<StockMovement>>(`/products/${productId}/stock`, {
      quantity,
      type,
      reason,
    });
    return data.data!;
  },

  async getMovements(productId: string) {
    const { data } = await api.get<ApiResponse<StockMovement[]>>(
      `/products/${productId}/stock-movements`
    );
    return data.data!;
  },

  async listAllMovements(page = 1, limit = 20) {
    const { data } = await api.get<
      ApiResponse<{ movements: StockMovement[]; pagination: Pagination }>
    >('/products/movements/all', { params: { page, limit } });
    return data.data!;
  },
};
