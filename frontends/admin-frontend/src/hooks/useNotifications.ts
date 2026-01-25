import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, Notification } from '../lib/notification.service';
import { useUser } from '../contexts/UserContext';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: (params?: { limit?: number; offset?: number; status?: 'unread' | 'read' | 'archived'; type?: string; priority?: string }) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export function useNotifications(autoRefresh: boolean = true, refreshInterval: number = 30000): UseNotificationsReturn {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const socketRef = useRef<any>(null);

  // Track if component is mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Store userId in localStorage when available
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem('userId', user.id);
    }
  }, [user]);

  const fetchNotifications = useCallback(async (params?: { limit?: number; offset?: number; status?: 'unread' | 'read' | 'archived'; type?: string; priority?: string }) => {
    try {
      setError(null);
      const response = await notificationService.getNotifications({
        limit: params?.limit || 5, // Default to 5 for bell icon
        offset: params?.offset || 0,
        status: params?.status,
        type: params?.type,
        priority: params?.priority,
      });
      setNotifications(response.data || []);
      if (response.unreadCount !== undefined) {
        setUnreadCount(response.unreadCount);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  const refreshNotifications = useCallback(async (params?: { limit?: number; offset?: number; status?: 'unread' | 'read' | 'archived'; type?: string; priority?: string }) => {
    await fetchNotifications(params);
    await fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const refreshUnreadCount = useCallback(async () => {
    await fetchUnreadCount();
  }, [fetchUnreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === id ? { ...notif, status: 'read' as const, readAt: new Date().toISOString() } : notif
        )
      );
      // Refresh unread count
      await fetchUnreadCount();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [fetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, status: 'read' as const, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      // Remove from local state
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
      // Refresh unread count
      await fetchUnreadCount();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [fetchUnreadCount]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Auto-refresh unread count
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined' || !autoRefresh) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchUnreadCount, isMounted]);

  // Listen for real-time notification updates via socket
  const userId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined' || !userId) return;

    // Import socket library dynamically
    import('../lib/socket').then(({ getSocketInstance }) => {
      const socket = getSocketInstance();
      
      if (!socket) {
        console.warn('⚠️  [Notifications] Socket not available, will retry when connected');
        return;
      }

      // Wait for socket to connect if not already connected
      if (!socket.connected) {
        const connectHandler = () => {
          setupNotificationListener(socket);
        };
        socket.once('connect', connectHandler);
        return () => {
          socket.off('connect', connectHandler);
        };
      }

      return setupNotificationListener(socket);
    });

    function setupNotificationListener(socket: any) {
      socketRef.current = socket;

      // Listen for notification updates
      const handleNotificationUpdate = (payload: {
        notification: Notification | null;
        unreadCount: number;
        eventType: 'NOTIFICATION_CREATED' | 'NOTIFICATION_UPDATED' | 'NOTIFICATION_DELETED';
        timestamp: string;
      }) => {
        console.log('📥 [Notifications] Received real-time notification update:', payload);

        // Update unread count
        setUnreadCount(payload.unreadCount);

        // Handle different event types
        switch (payload.eventType) {
          case 'NOTIFICATION_CREATED':
            if (payload.notification) {
              // Add new notification to the top of the list
              setNotifications((prev) => [payload.notification!, ...prev]);
            }
            break;

          case 'NOTIFICATION_UPDATED':
            if (payload.notification) {
              // Update existing notification
              setNotifications((prev) =>
                prev.map((notif) =>
                  notif._id === payload.notification!._id ? payload.notification! : notif
                )
              );
            } else {
              // Bulk update (e.g., mark all as read) - refresh list
              fetchNotifications();
            }
            break;

          case 'NOTIFICATION_DELETED':
            if (payload.notification) {
              // Remove notification from list
              setNotifications((prev) =>
                prev.filter((notif) => notif._id !== payload.notification!._id)
              );
            }
            break;
        }
      };

      socket.on('NOTIFICATION_UPDATE', handleNotificationUpdate);

      return () => {
        if (socketRef.current) {
          socketRef.current.off('NOTIFICATION_UPDATE', handleNotificationUpdate);
        }
      };
    }
  }, [isMounted, userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
