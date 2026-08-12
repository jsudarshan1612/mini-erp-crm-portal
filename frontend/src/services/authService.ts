import api from './api';
import { User, ApiResponse } from '../types';

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      email,
      password,
    });
    return data.data!;
  },

  async me() {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data.data!;
  },

  async listUsers() {
    const { data } = await api.get<ApiResponse<User[]>>('/auth/users');
    return data.data!;
  },
};
