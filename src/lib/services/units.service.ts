import { apiClient } from '../api-config'
import type { Unit } from '../types'

interface CreateUnitRequest {
  code: string
  name: string
}

interface UpdateUnitRequest {
  code?: string
  name?: string
}

export const unitsService = {
  async list(): Promise<Unit[]> {
    return apiClient.get<Unit[]>('/units')
  },

  async getById(id: string): Promise<Unit> {
    return apiClient.get<Unit>(`/units/${id}`)
  },

  async create(data: CreateUnitRequest): Promise<Unit> {
    return apiClient.post<Unit>('/units', data)
  },

  async update(id: string, data: UpdateUnitRequest): Promise<Unit> {
    return apiClient.patch<Unit>(`/units/${id}`, data)
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/units/${id}`)
  }
}
