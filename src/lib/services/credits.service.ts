import { apiClient } from '../api-config'
import type { CreditPayment, CreditsSummary, CreditsListParams } from '../types'

interface CreditsListResponse {
  payments: CreditPayment[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const creditsService = {
  async list(params: CreditsListParams = {}): Promise<CreditsListResponse> {
    return apiClient.get<CreditsListResponse>('/credits', params)
  },

  async getSummary(): Promise<CreditsSummary> {
    return apiClient.get<CreditsSummary>('/credits/summary')
  },

  async markAsPaid(paymentId: string): Promise<CreditPayment> {
    return apiClient.patch<CreditPayment>(`/credits/${paymentId}/mark-paid`)
  }
}
