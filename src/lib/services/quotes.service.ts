import { apiClient } from '../api-config';
import type { 
  Quote, 
  CreateQuoteRequest, 
  UpdateQuoteRequest, 
  QuoteListParams,
  QuoteStockCheck,
  CheckStockRequest,
  ApproveQuoteRequest,
  ApproveQuoteResponse
} from '../types';

interface QuotesResponse {
  quotes: Quote[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const quotesService = {
  async list(params?: QuoteListParams): Promise<QuotesResponse> {
    return apiClient.get<QuotesResponse>('/quotes', params);
  },

  async getById(id: string): Promise<Quote> {
    return apiClient.get<Quote>(`/quotes/${id}`);
  },

  async checkStock(data: CheckStockRequest): Promise<QuoteStockCheck> {
    return apiClient.post<QuoteStockCheck>('/quotes/check-stock', data);
  },

  async checkStockById(id: string): Promise<QuoteStockCheck> {
    return apiClient.get<QuoteStockCheck>(`/quotes/${id}/check-stock`);
  },

  async create(data: CreateQuoteRequest): Promise<Quote> {
    return apiClient.post<Quote>('/quotes', data);
  },

  async update(id: string, data: UpdateQuoteRequest): Promise<Quote> {
    return apiClient.put<Quote>(`/quotes/${id}`, data);
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/quotes/${id}`);
  },

  async updateItemPrice(itemId: string, data: { unitPrice?: number; discount?: number; quantity?: number }): Promise<Quote> {
    return apiClient.patch<Quote>(`/quotes/items/${itemId}/price`, data);
  },

  async approve(id: string, data: ApproveQuoteRequest): Promise<ApproveQuoteResponse> {
    return apiClient.put<ApproveQuoteResponse>(`/quotes/${id}`, data);
  }
};
