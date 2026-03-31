import { apiClient } from '../api-config';
import type { 
  Supplier, 
  CreateSupplierRequest, 
  UpdateSupplierRequest, 
  SupplierListParams 
} from '../types';

interface SuppliersResponse {
  suppliers: Supplier[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const suppliersService = {
  async list(params?: SupplierListParams): Promise<SuppliersResponse> {
    return apiClient.get<SuppliersResponse>('/suppliers', params);
  },

  async getById(id: string): Promise<Supplier> {
    return apiClient.get<Supplier>(`/suppliers/${id}`);
  },

  async create(data: CreateSupplierRequest): Promise<Supplier> {
    return apiClient.post<Supplier>('/suppliers', data);
  },

  async update(id: string, data: UpdateSupplierRequest): Promise<Supplier> {
    return apiClient.put<Supplier>(`/suppliers/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/suppliers/${id}`);
  }
};
