import { apiClient } from '../api-config';
import type { 
  Warehouse,
  WarehouseWithStock,
  InventoryMovement,
  CreateMovementRequest,
  TransferStockRequest,
  TransferStockResponse,
  MovementListParams,
  LowStockProduct,
  InventoryItem,
  InventoryListParams
} from '../types';

interface MovementsResponse {
  movements: InventoryMovement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface WarehousesResponse {
  warehouses: Warehouse[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface InventoryResponse {
  inventory: InventoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const inventoryService = {
  async getInventory(params?: InventoryListParams): Promise<InventoryResponse> {
    return apiClient.get<InventoryResponse>('/inventory', params);
  },

  async listWarehouses(): Promise<WarehousesResponse> {
    return apiClient.get<WarehousesResponse>('/inventory/warehouses');
  },

  async getWarehouseById(id: string): Promise<WarehouseWithStock> {
    return apiClient.get<WarehouseWithStock>(`/inventory/warehouses/${id}`);
  },

  async createWarehouse(data: { 
    code: string; 
    name: string; 
    description?: string; 
    type: string;
    location?: string;
    isActive?: boolean;
  }): Promise<Warehouse> {
    return apiClient.post<Warehouse>('/inventory/warehouses', data);
  },

  async updateWarehouse(id: string, data: { 
    code?: string;
    name?: string; 
    description?: string;
    type?: string;
    location?: string; 
    isActive?: boolean;
  }): Promise<Warehouse> {
    return apiClient.put<Warehouse>(`/inventory/warehouses/${id}`, data);
  },

  async deleteWarehouse(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/inventory/warehouses/${id}`);
  },

  async listMovements(params?: MovementListParams): Promise<MovementsResponse> {
    return apiClient.get<MovementsResponse>('/inventory/movements', params);
  },

  async getLowStock(): Promise<LowStockProduct[]> {
    return apiClient.get<LowStockProduct[]>('/inventory/low-stock');
  },

  async createMovement(data: CreateMovementRequest): Promise<InventoryMovement> {
    return apiClient.post<InventoryMovement>('/inventory/movements', data);
  },

  async transferStock(data: TransferStockRequest): Promise<TransferStockResponse> {
    return apiClient.post<TransferStockResponse>('/inventory/transfer', data);
  }
};
