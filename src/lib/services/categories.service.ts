import { apiClient } from '../api-config';
import type { Category } from '../types';

interface CategoriesResponse {
  categories: Category[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const categoriesService = {
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<CategoriesResponse> {
    return apiClient.get<CategoriesResponse>('/categories', params);
  },

  async getById(id: string): Promise<Category> {
    return apiClient.get<Category>(`/categories/${id}`);
  },

  async create(data: { name: string; description?: string }): Promise<Category> {
    return apiClient.post<Category>('/categories', data);
  },

  async update(id: string, data: { name?: string; description?: string }): Promise<Category> {
    return apiClient.put<Category>(`/categories/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/categories/${id}`);
  }
};
