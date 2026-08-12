import api from './api';
import { ApiResponse, Customer, CustomerFollowUp, Pagination } from '../types';

export interface CustomerQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerType?: string;
}

export const customerService = {
  async list(params: CustomerQuery = {}) {
    const { data } = await api.get<
      ApiResponse<{ customers: Customer[]; pagination: Pagination }>
    >('/customers', { params });
    return data.data!;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return data.data!;
  },

  async create(payload: Partial<Customer>) {
    const { data } = await api.post<ApiResponse<Customer>>('/customers', payload);
    return data.data!;
  },

  async update(id: string, payload: Partial<Customer>) {
    const { data } = await api.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return data.data!;
  },

  async remove(id: string) {
    await api.delete(`/customers/${id}`);
  },

  async addFollowUp(id: string, note: string, followUpDate: string) {
    const { data } = await api.post<ApiResponse<CustomerFollowUp>>(`/customers/${id}/followups`, {
      note,
      followUpDate,
    });
    return data.data!;
  },

  async getFollowUps(id: string) {
    const { data } = await api.get<ApiResponse<CustomerFollowUp[]>>(`/customers/${id}/followups`);
    return data.data!;
  },
};
