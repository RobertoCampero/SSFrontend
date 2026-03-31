import type { CreditPayment, CreditsSummary, CreditsListParams } from '../types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ssbackend-production-133b.up.railway.app/api'

export const creditsService = {
  async list(params: CreditsListParams = {}) {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.status) queryParams.append('status', params.status)
    if (params.clientId) queryParams.append('clientId', params.clientId)
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)

    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/credits?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al cargar créditos')
    }

    return response.json() as Promise<{
      payments: CreditPayment[]
      pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }>
  },

  async getSummary() {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/credits/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al cargar resumen de créditos')
    }

    return response.json() as Promise<CreditsSummary>
  },

  async markAsPaid(paymentId: string) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/credits/${paymentId}/mark-paid`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al marcar pago como pagado')
    }

    return response.json() as Promise<CreditPayment>
  }
}
