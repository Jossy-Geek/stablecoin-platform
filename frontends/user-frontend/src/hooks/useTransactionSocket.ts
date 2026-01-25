import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocketConnection, disconnectSocket, isSocketConnected } from '../lib/socket';
import { Socket } from 'socket.io-client';

/**
 * Transaction update event payload
 */
export interface TransactionUpdatePayload {
  transactionId: string;
  userId: string;
  transactionType: string;
  amount: string;
  currency?: string;
  status: string;
  txHash?: string;
  timestamp: string;
  reason?: string;
  eventType?: string; // Original event type (optional, for backward compatibility)
}

/**
 * Hook for real-time transaction updates via Socket.IO
 * 
 * @param userId Current user ID
 * @param onTransactionUpdate Callback when transaction is updated
 * @returns Socket connection status and utilities
 */
export function useTransactionSocket(
  userId: string | null,
  onTransactionUpdate?: (payload: TransactionUpdatePayload) => void,
) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const onUpdateRef = useRef(onTransactionUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onUpdateRef.current = onTransactionUpdate;
  }, [onTransactionUpdate]);

  /**
   * Handle transaction update events
   */
  const handleTransactionUpdate = useCallback((payload: TransactionUpdatePayload) => {
    console.log('📥 [Transaction Socket] Received transaction update:', payload);
    
    if (onUpdateRef.current) {
      onUpdateRef.current(payload);
    }
  }, []);

  /**
   * Extract user ID from JWT token (fallback)
   */
  const getUserIdFromToken = (token: string): string | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return payload.userId || payload.id || null;
    } catch (error) {
      console.error('❌ [Transaction Socket] Error parsing token:', error);
      return null;
    }
  };

  /**
   * Initialize socket connection
   */
  useEffect(() => {
    // Get token from localStorage first
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️  [Transaction Socket] No token found, cannot connect');
      setConnectionError('No authentication token found');
      return;
    }

    // Try to get user ID from prop, or extract from token
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      console.log('ℹ️  [Transaction Socket] User ID not provided, extracting from token...');
      effectiveUserId = getUserIdFromToken(token);
      if (effectiveUserId) {
        console.log(`✅ [Transaction Socket] Extracted user ID from token: ${effectiveUserId}`);
      }
    }

    // Don't connect if no user ID available
    if (!effectiveUserId) {
      console.log('ℹ️  [Transaction Socket] No user ID available, skipping connection');
      setConnectionError('User ID not available');
      return;
    }

    // Get socket URL from environment
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    console.log('🔍 [Transaction Socket] Environment check:');
    console.log(`🔍 [Transaction Socket] NEXT_PUBLIC_SOCKET_URL: ${socketUrl || 'NOT SET'}`);
    console.log(`🔍 [Transaction Socket] All env vars:`, {
      NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
      NEXT_PUBLIC_TRANSACTION_API_URL: process.env.NEXT_PUBLIC_TRANSACTION_API_URL,
    });

    if (!socketUrl) {
      console.error('❌ [Transaction Socket] NEXT_PUBLIC_SOCKET_URL is not set');
      console.error('❌ [Transaction Socket] Please add NEXT_PUBLIC_SOCKET_URL=http://localhost:3005 to .env.local');
      setConnectionError('Socket server URL not configured');
      return;
    }

    console.log('🔌 [Transaction Socket] Initializing connection...');
    console.log(`🔌 [Transaction Socket] URL: ${socketUrl}`);
    console.log(`🔌 [Transaction Socket] User ID: ${userId}`);
    console.log(`🔌 [Transaction Socket] Token exists: ${!!token}`);

    try {
      // Get socket connection
      const socket = getSocketConnection(token, socketUrl);
      socketRef.current = socket;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('✅ [Transaction Socket] Connected successfully');
        console.log(`✅ [Transaction Socket] Socket ID: ${socket.id}`);
        setIsConnected(true);
        setConnectionError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ [Transaction Socket] Disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server disconnected, reconnect manually
          console.log('🔄 [Transaction Socket] Server disconnected, will reconnect...');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ [Transaction Socket] ========== CONNECTION ERROR ==========');
        console.error('❌ [Transaction Socket] Error:', error);
        console.error('❌ [Transaction Socket] Error details:', {
          message: error.message,
          type: error.type,
          description: error.description,
          context: error.context,
          data: error.data,
        });
        
        // Provide more specific error messages
        let errorMessage = 'Connection failed';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.type === 'TransportError') {
          errorMessage = 'Network error - check if socket service is running';
        } else if (error.type === 'UnauthorizedError' || error.message?.includes('auth')) {
          errorMessage = 'Authentication failed - check JWT token';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Connection timeout - service may be unreachable';
        }
        
        setConnectionError(errorMessage);
        setIsConnected(false);
      });

      // Additional debugging events
      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 [Transaction Socket] Reconnection attempt #${attemptNumber}`);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ [Transaction Socket] Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setConnectionError(null);
      });

      socket.on('reconnect_error', (error) => {
        console.error('❌ [Transaction Socket] Reconnection error:', error);
      });

      socket.on('reconnect_failed', () => {
        console.error('❌ [Transaction Socket] Reconnection failed after all attempts');
        setConnectionError('Failed to reconnect after multiple attempts');
      });

      // Listen to single TRANSACTION_UPDATE event type
      socket.on('TRANSACTION_UPDATE', (payload: TransactionUpdatePayload) => {
        console.log(`📥 [Transaction Socket] Received TRANSACTION_UPDATE:`, payload);
        console.log(`📥 [Transaction Socket] Status: ${payload.status}`);
        console.log(`📥 [Transaction Socket] Transaction Type: ${payload.transactionType}`);
        
        // Payload already contains all necessary data (status, transactionType, etc.)
        handleTransactionUpdate(payload);
      });

      // Listen for authentication errors from server
      socket.on('auth_error', (error: { message: string; errorType?: string }) => {
        console.error('❌ [Transaction Socket] Authentication error from server:', error);
        setConnectionError(error.message || 'Authentication failed');
        setIsConnected(false);
      });

      // Ping/Pong for connection health
      socket.on('pong', (data) => {
        console.log('🏓 [Transaction Socket] Pong received:', data);
      });

      // Send ping periodically
      const pingInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
        }
      }, 30000); // Every 30 seconds

      // Cleanup function
      return () => {
        console.log('🧹 [Transaction Socket] Cleaning up connection...');
        
        // Clear ping interval
        clearInterval(pingInterval);

        // Remove event listener
        socket.off('TRANSACTION_UPDATE');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('auth_error');
        socket.off('pong');
        socket.off('reconnect_attempt');
        socket.off('reconnect');
        socket.off('reconnect_error');
        socket.off('reconnect_failed');

        // Disconnect socket
        if (socket.connected) {
          socket.disconnect();
        }
        
        socketRef.current = null;
        setIsConnected(false);
      };
    } catch (error: any) {
      console.error('❌ [Transaction Socket] Error initializing socket:', error);
      setConnectionError(error.message || 'Failed to initialize socket');
      setIsConnected(false);
    }
  }, [userId, handleTransactionUpdate]); // Note: effectiveUserId is computed inside, so we use userId in deps

  /**
   * Manually reconnect socket
   */
  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      console.log('🔄 [Transaction Socket] Manually reconnecting...');
      socketRef.current.connect();
    }
  }, []);

  /**
   * Manually disconnect socket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 [Transaction Socket] Manually disconnecting...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    isConnected,
    connectionError,
    reconnect,
    disconnect,
    socket: socketRef.current,
  };
}
