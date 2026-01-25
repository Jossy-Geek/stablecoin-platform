import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useNotifications } from '../hooks/useNotifications';
import { Notification } from '../lib/notification.service';

export default function NotificationsPage() {
  const router = useRouter();
  const { query } = router;
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Load all notifications (not just recent ones)
  useEffect(() => {
    refreshNotifications({ limit: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle notification ID from query parameter
  useEffect(() => {
    if (query.id && notifications.length > 0) {
      const notification = notifications.find(n => n._id === query.id);
      if (notification) {
        setSelectedNotification(notification);
        setShowModal(true);
        if (notification.status === 'unread') {
          markAsRead(notification._id);
        }
        // Remove ID from URL after handling
        router.replace('/notifications', undefined, { shallow: true });
      }
    }
  }, [query.id, notifications, markAsRead, router]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return notification.status === 'unread';
    if (filter === 'read') return notification.status === 'read';
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'system':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'security':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
    if (notification.status === 'unread') {
      await markAsRead(notification._id);
    }
  };

  const handleTransactionClick = (transactionId: string) => {
    setShowModal(false);
    router.push(`/transactions/${transactionId}`);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'read'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-1">No notifications</p>
              <p className="text-sm text-gray-500">
                {filter === 'all' ? "You're all caught up!" : `No ${filter} notifications`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`px-3 py-[0.2rem] hover:bg-gray-50 cursor-pointer transition-colors ${
                    notification.status === 'unread' ? 'bg-blue-50' : ''
                  } ${selectedNotification?._id === notification._id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    <div className={`flex-shrink-0 mt-0.5 ${notification.status === 'unread' ? 'text-blue-600' : 'text-gray-400'}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`text-sm font-semibold ${notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            {notification.status === 'unread' && (
                              <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-1.5 line-clamp-2">{notification.message}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                            <span className="text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
                            {notification.metadata?.transactionId && (
                              <span className="text-xs text-gray-500">
                                Transaction: {notification.metadata.transactionId.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                            aria-label="Delete notification"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Metadata Modal */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedNotification(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Message</p>
                <p className="text-base text-gray-900">{selectedNotification.message}</p>
              </div>

              {/* Metadata */}
              {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Additional Information</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-3">
                      {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-3">
                          <span className="text-sm font-medium text-gray-600 min-w-[120px] capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-sm text-gray-900 flex-1">
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button for Transaction */}
              {selectedNotification.type === 'transaction' && selectedNotification.metadata?.transactionId && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleTransactionClick(selectedNotification.metadata.transactionId)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    View Transaction Details
                  </button>
                </div>
              )}

              {/* Action Button for other types with actionUrl */}
              {selectedNotification.type !== 'transaction' && selectedNotification.metadata?.actionUrl && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      router.push(selectedNotification.metadata.actionUrl);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    View Details
                  </button>
                </div>
              )}

              {/* Notification Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 text-gray-900 capitalize">{selectedNotification.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Priority:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getPriorityColor(selectedNotification.priority)}`}>
                      {selectedNotification.priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 text-gray-900 capitalize">{selectedNotification.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 text-gray-900">{formatTime(selectedNotification.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedNotification(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
