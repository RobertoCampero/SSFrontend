import { apiClient } from '../api-config';
import type { Notification, NotificationsResponse, UnreadCountResponse } from '../types';

export const notificationsService = {
  async list(params?: { page?: number; limit?: number }): Promise<NotificationsResponse> {
    return apiClient.get<NotificationsResponse>('/notifications', params);
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiClient.get<UnreadCountResponse>('/notifications/unread-count');
  },

  async markAsRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>('/notifications/read-all');
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/notifications/${id}`);
  },
};
