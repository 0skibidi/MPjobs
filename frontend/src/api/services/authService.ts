import axios from '../axios';
import { LoginRequest, RegisterRequest, AuthResponse } from '../../types/api';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await axios.post<{ accessToken: string }>('/auth/refresh-token', {
      refreshToken
    });
    return response.data;
  },

  async logout(): Promise<void> {
    await axios.post('/auth/logout');
  },

  async verifyEmail(token: string): Promise<void> {
    await axios.post(`/auth/verify-email/${token}`);
  },

  async forgotPassword(email: string): Promise<void> {
    await axios.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await axios.post(`/auth/reset-password/${token}`, { password });
  }
}; 