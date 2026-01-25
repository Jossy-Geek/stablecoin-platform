import { io, Socket } from 'socket.io-client';

/**
 * Socket connection utility
 * Manages Socket.IO connection with JWT authentication
 */

let socketInstance: Socket | null = null;

/**
 * Get or create socket connection
 * @param token JWT token for authentication
 * @param socketUrl Socket server URL
 * @returns Socket instance
 */
export function getSocketConnection(token: string, socketUrl: string): Socket {
  // If socket already exists and is connected, return it
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  // Disconnect existing socket if it exists
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  // Create new socket connection
  console.log('🔌 [Socket] ========== CREATING SOCKET CONNECTION ==========');
  console.log(`🔌 [Socket] URL: ${socketUrl}`);
  console.log(`🔌 [Socket] Token exists: ${!!token}`);
  console.log(`🔌 [Socket] Token length: ${token.length}`);
  console.log(`🔌 [Socket] Token preview: ${token.substring(0, 30)}...`);
  console.log(`🔌 [Socket] Full token (first 100 chars): ${token.substring(0, 100)}`);

  socketInstance = io(socketUrl, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000, // 20 second timeout
    forceNew: false, // Reuse connection if available
    autoConnect: true,
    upgrade: true, // Allow transport upgrades
    rememberUpgrade: true, // Remember transport preference
    // Add extra options for debugging
    query: {
      // Add any query params if needed
    },
  });

  // Add connection event listeners for debugging
  socketInstance.on('connect', () => {
    console.log('✅ [Socket] Connection established');
    console.log(`✅ [Socket] Socket ID: ${socketInstance?.id}`);
  });

  socketInstance.on('connect_error', (error) => {
    console.error('❌ [Socket] ========== CONNECTION ERROR ==========');
    console.error('❌ [Socket] Error object:', error);
    console.error('❌ [Socket] Error message:', error.message);
    console.error('❌ [Socket] Error type:', error.type);
    console.error('❌ [Socket] Error description:', error.description);
    console.error('❌ [Socket] Error context:', error.context);
    console.error('❌ [Socket] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
  });

  socketInstance.on('disconnect', (reason, details) => {
    console.log('❌ [Socket] ========== DISCONNECTED ==========');
    console.log('❌ [Socket] Reason:', reason);
    console.log('❌ [Socket] Details:', details);
    
    // Log specific disconnect reasons
    if (reason === 'io server disconnect') {
      console.error('❌ [Socket] Server forcefully disconnected the client');
    } else if (reason === 'io client disconnect') {
      console.log('ℹ️  [Socket] Client manually disconnected');
    } else if (reason === 'ping timeout') {
      console.error('❌ [Socket] Connection timed out (ping timeout)');
    } else if (reason === 'transport close') {
      console.error('❌ [Socket] Connection closed by transport');
    } else if (reason === 'transport error') {
      console.error('❌ [Socket] Transport error occurred');
    }
  });

  return socketInstance;
}

/**
 * Disconnect socket connection
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    console.log('🔌 [Socket] Disconnecting socket...');
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Get current socket instance (if connected)
 */
export function getSocketInstance(): Socket | null {
  return socketInstance;
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socketInstance !== null && socketInstance.connected;
}
