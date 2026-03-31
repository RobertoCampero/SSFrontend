import { apiClient } from '../api-config';
import type { 
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  BulkCreatePermissionsRequest,
  PermissionListParams,
  PermissionsByModule
} from '../types';

interface PermissionsResponse {
  permissions: Permission[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const permissionsService = {
  async list(params?: PermissionListParams): Promise<PermissionsResponse> {
    return apiClient.get<PermissionsResponse>('/permissions', params);
  },

  async getByModule(): Promise<PermissionsByModule> {
    return apiClient.get<PermissionsByModule>('/permissions/by-module');
  },

  async getById(id: string): Promise<Permission> {
    return apiClient.get<Permission>(`/permissions/${id}`);
  },

  async create(data: CreatePermissionRequest): Promise<Permission> {
    return apiClient.post<Permission>('/permissions', data);
  },

  async bulkCreate(data: BulkCreatePermissionsRequest): Promise<Permission[]> {
    return apiClient.post<Permission[]>('/permissions/bulk', data);
  },

  async update(id: string, data: UpdatePermissionRequest): Promise<Permission> {
    return apiClient.put<Permission>(`/permissions/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/permissions/${id}`);
  }
};
