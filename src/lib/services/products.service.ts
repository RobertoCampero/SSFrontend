import { apiClient } from '../api-config';
import type { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductListParams,
  ProductStock 
} from '../types';

interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const productsService = {
  async list(params?: ProductListParams): Promise<ProductsResponse> {
    return apiClient.get<ProductsResponse>('/products', params);
  },

  async getById(id: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`);
  },

  async getStock(id: string): Promise<ProductStock> {
    return apiClient.get<ProductStock>(`/products/${id}/stock`);
  },

  async create(data: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>('/products', data);
  },

  async update(id: string, data: UpdateProductRequest): Promise<Product> {
    return apiClient.put<Product>(`/products/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/products/${id}`);
  }
};
