import { apiClient } from '../api-config';
import type { User } from '../types';

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  isActive?: boolean;
  warehouseId?: string | number;
}

interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  isActive?: boolean;
  warehouseId?: string | number | null;
}

interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const usersService = {
  async list(params?: UserListParams): Promise<UsersResponse> {
    return apiClient.get<UsersResponse>('/users', params);
  },

  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  async create(data: CreateUserRequest): Promise<User> {
    return apiClient.post<User>('/users', data);
  },

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/users/${id}`);
  },

  async assignRole(userId: string, roleId: string): Promise<any> {
    return apiClient.post<any>('/roles/assign-user', { 
      userId: Number(userId), 
      roleId: Number(roleId) 
    });
  },

  async removeRole(userId: string, roleId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/roles/remove-user', { 
      userId: Number(userId), 
      roleId: Number(roleId) 
    });
  }
};
