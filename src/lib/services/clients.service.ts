import { apiClient } from '../api-config';
import type { 
  Client, 
  CreateClientRequest, 
  UpdateClientRequest, 
  ClientListParams 
} from '../types';

interface ClientsResponse {
  clients: Client[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const clientsService = {
  async list(params?: ClientListParams): Promise<ClientsResponse> {
    return apiClient.get<ClientsResponse>('/clients', params);
  },

  async getById(id: string): Promise<Client> {
    return apiClient.get<Client>(`/clients/${id}`);
  },

  async create(data: CreateClientRequest): Promise<Client> {
    return apiClient.post<Client>('/clients', data);
  },

  async update(id: string, data: UpdateClientRequest): Promise<Client> {
    return apiClient.put<Client>(`/clients/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/clients/${id}`);
  }
};
