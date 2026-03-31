import { apiClient } from '../api-config';
import type { 
  Role, 
  Permission,
  RolePermission,
  UserRole,
  CreateRoleRequest, 
  UpdateRoleRequest,
  AssignPermissionsRequest,
  AssignRoleToUserRequest,
  RemoveRoleFromUserRequest,
  RoleListParams
} from '../types';

interface RolesResponse {
  roles: Role[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const rolesService = {
  async list(params?: RoleListParams): Promise<RolesResponse> {
    return apiClient.get<RolesResponse>('/roles', params);
  },

  async getById(id: string): Promise<Role> {
    return apiClient.get<Role>(`/roles/${id}`);
  },

  async create(data: CreateRoleRequest): Promise<Role> {
    return apiClient.post<Role>('/roles', data);
  },

  async update(id: string, data: UpdateRoleRequest): Promise<Role> {
    return apiClient.put<Role>(`/roles/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/roles/${id}`);
  },

  async assignPermissions(roleId: string, data: AssignPermissionsRequest): Promise<RolePermission[]> {
    return apiClient.post<RolePermission[]>(`/roles/${roleId}/permissions`, data);
  },

  async removePermission(roleId: string, permissionId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/roles/${roleId}/permissions/${permissionId}`);
  },

  async assignToUser(data: AssignRoleToUserRequest): Promise<UserRole> {
    return apiClient.post<UserRole>('/roles/assign-user', data);
  },

  async removeFromUser(data: RemoveRoleFromUserRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/roles/remove-user', data);
  },

  async getUserRoles(userId: string): Promise<Role[]> {
    return apiClient.get<Role[]>(`/roles/user/${userId}/roles`);
  },

  async getUserPermissions(userId: string): Promise<Permission[]> {
    return apiClient.get<Permission[]>(`/roles/user/${userId}/permissions`);
  }
};
