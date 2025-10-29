import axios from '../axios';
import { UserResponse, UsersResponse } from '../../types/api';

export const usersService = {
  async getProfile(): Promise<UserResponse> {
    const response = await axios.get<UserResponse>('/users/profile');
    return response.data;
  },

  async updateProfile(data: FormData): Promise<UserResponse> {
    const response = await axios.put<UserResponse>('/users/profile', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await axios.put('/users/change-password', data);
  },

  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<UsersResponse> {
    const response = await axios.get<UsersResponse>('/users', { params });
    return response.data;
  },

  async getUser(id: string): Promise<UserResponse> {
    const response = await axios.get<UserResponse>(`/users/${id}`);
    return response.data;
  },

  async updateUser(id: string, data: FormData): Promise<UserResponse> {
    const response = await axios.put<UserResponse>(`/users/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await axios.delete(`/users/${id}`);
  }
}; 