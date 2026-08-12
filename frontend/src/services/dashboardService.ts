import api from './api';
import { ApiResponse, DashboardData } from '../types';

export const dashboardService = {
  async getStats() {
    const { data } = await api.get<ApiResponse<DashboardData>>('/dashboard');
    return data.data!;
  },
};
