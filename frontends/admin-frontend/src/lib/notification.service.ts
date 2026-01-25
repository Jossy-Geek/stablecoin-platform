import axios from 'axios';

const NOTIFICATION_API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'http://localhost:3004';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'transaction' | 'system' | 'security' | 'account' | 'wallet' | 'other';
  status: 'unread' | 'read' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: Record<string, any>;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
  unreadCount?: number;
}

export interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

class NotificationService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get notifications for the current user
   */
  async getNotifications(params?: {
    status?: 'unread' | 'read' | 'archived';
    type?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<NotificationResponse> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    const queryParams = new URLSearchParams({
      userId,
      ...(params?.status && { status: params.status }),
      ...(params?.type && { type: params.type }),
      ...(params?.priority && { priority: params.priority }),
      ...(params?.limit && { limit: params.limit.toString() }),
      ...(params?.offset && { offset: params.offset.toString() }),
    });

    const response = await axios.get<NotificationResponse>(
      `${NOTIFICATION_API_URL}/notifications?${queryParams.toString()}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const userId = this.getUserId();
    if (!userId) {
      return 0;
    }

    try {
      const response = await axios.get<UnreadCountResponse>(
        `${NOTIFICATION_API_URL}/notifications/unread-count?userId=${userId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.unreadCount || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Get a single notification by ID
   */
  async getNotification(id: string): Promise<Notification | null> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    try {
      const response = await axios.get<{ success: boolean; data: Notification }>(
        `${NOTIFICATION_API_URL}/notifications/${id}?userId=${userId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notification:', error);
      return null;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    try {
      await axios.patch(
        `${NOTIFICATION_API_URL}/notifications/${id}/read?userId=${userId}`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    try {
      const response = await axios.patch<{ success: boolean; count: number }>(
        `${NOTIFICATION_API_URL}/notifications/mark-all-read?userId=${userId}`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data.count || 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Archive a notification
   */
  async archiveNotification(id: string): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    try {
      await axios.patch(
        `${NOTIFICATION_API_URL}/notifications/${id}/archive?userId=${userId}`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return true;
    } catch (error) {
      console.error('Error archiving notification:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    try {
      await axios.delete(
        `${NOTIFICATION_API_URL}/notifications/${id}?userId=${userId}`,
        { headers: this.getAuthHeaders() }
      );
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Get user ID from token or localStorage
   */
  private getUserId(): string | null {
    // Try to get from localStorage if stored
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      return storedUserId;
    }

    // Try to decode from token (basic implementation)
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.userId || payload.id || payload.sub || null;
        // Store in localStorage for future use
        if (userId) {
          localStorage.setItem('userId', userId);
        }
        return userId;
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    return null;
  }
}

export const notificationService = new NotificationService();
