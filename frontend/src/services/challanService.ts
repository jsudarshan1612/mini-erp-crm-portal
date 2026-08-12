import api from './api';
import { ApiResponse, Challan, Pagination } from '../types';

export interface ChallanQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ChallanItemInput {
  productId: string;
  quantity: number;
}

export const challanService = {
  async list(params: ChallanQuery = {}) {
    const { data } = await api.get<
      ApiResponse<{ challans: Challan[]; pagination: Pagination }>
    >('/challans', { params });
    return data.data!;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<Challan>>(`/challans/${id}`);
    return data.data!;
  },

  async create(customerId: string, items: ChallanItemInput[]) {
    const { data } = await api.post<ApiResponse<Challan>>('/challans', { customerId, items });
    return data.data!;
  },

  async update(id: string, customerId: string, items: ChallanItemInput[]) {
    const { data } = await api.put<ApiResponse<Challan>>(`/challans/${id}`, {
      customerId,
      items,
    });
    return data.data!;
  },

  async confirm(id: string) {
    const { data } = await api.post<ApiResponse<Challan>>(`/challans/${id}/confirm`);
    return data.data!;
  },

  async cancel(id: string) {
    const { data } = await api.post<ApiResponse<Challan>>(`/challans/${id}/cancel`);
    return data.data!;
  },
};
