# Socket Connection Debugging - "WebSocket is closed before the connection is established"

## What This Error Means

This error occurs when:
1. The WebSocket handshake starts but fails before completion
2. The server closes the connection immediately (usually due to authentication failure)
3. The guard rejects the connection before it fully establishes

## Enhanced Debugging Steps

### 1. Check Browser Console

When you try to connect, you should now see detailed logs:

**Frontend logs (browser console):**
```
🔌 [Socket] ========== CREATING SOCKET CONNECTION ==========
🔌 [Socket] URL: http://localhost:3005
🔌 [Socket] Token exists: true
🔌 [Socket] Token length: xxx
```

**If connection fails:**
```
❌ [Socket] ========== CONNECTION ERROR ==========
❌ [Socket] Error message: ...
```

### 2. Check Socket Service Console

**If guard is reached:**
```
🔐 [Auth Guard] ========== NEW CONNECTION ATTEMPT ==========
🔍 [Auth Guard] Extracting token from socket...
```

**If token not found:**
```
❌ [Auth Guard] ========== AUTHENTICATION FAILED ==========
❌ [Auth Guard] No token found...
```

**If token verification fails:**
```
❌ [Auth Guard] ========== TOKEN VERIFICATION FAILED ==========
❌ [Auth Guard] Error message: ...
```

### 3. Common Causes

#### A. Token Not Being Sent
**Symptoms:**
- Frontend logs show token exists
- Socket service logs show "No token found"
- `handshake.auth` is empty

**Solution:**
- Verify token is in localStorage: `localStorage.getItem('token')`
- Check token is being passed correctly in `auth` object
- Verify Socket.IO client version compatibility

#### B. JWT_SECRET Mismatch
**Symptoms:**
- Socket service logs show "Token verification failed"
- Error message: "invalid signature" or "jwt malformed"

**Solution:**
- Check `transaction-socket-service/.env` has `JWT_SECRET`
- Compare with service that issues tokens
- They MUST be identical

#### C. Token Expired/Invalid
**Symptoms:**
- Error: "TokenExpiredError" or "JsonWebTokenError"
- Token exists but verification fails

**Solution:**
- Check token expiration
- Try logging out and logging in again
- Verify token format is correct

#### D. CORS Blocking
**Symptoms:**
- No logs appear in socket service
- Connection fails immediately
- Browser console shows CORS error

**Solution:**
- Check `CORS_ORIGIN` in socket service `.env`
- Must include `http://localhost:3006`
- Restart socket service after changing `.env`

### 4. Manual Test in Browser Console

```javascript
// 1. Check token exists
const token = localStorage.getItem('token');
console.log('Token:', token ? 'EXISTS' : 'MISSING');
console.log('Token length:', token?.length);

// 2. Try manual connection
const io = require('socket.io-client');
const socket = io('http://localhost:3005', {
  auth: { token: token },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected!', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('❌ Error:', err);
  console.error('Message:', err.message);
  console.error('Type:', err.type);
});

socket.on('auth_error', (err) => {
  console.error('❌ Auth Error:', err);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

### 5. Verify Service Configuration

**Check socket service `.env`:**
```env
PORT=3005
JWT_SECRET=<must match token issuer>
CORS_ORIGIN=http://localhost:3006,http://localhost:3007
```

**Check frontend `.env.local`:**
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3005
```

### 6. Network Debugging

**Test if service is reachable:**
```bash
# HTTP endpoint test
curl http://localhost:3005

# WebSocket test (if wscat installed)
wscat -c ws://localhost:3005/socket.io/?EIO=4&transport=websocket
```

### 7. Expected Behavior

**Successful connection flow:**
1. Frontend creates socket connection
2. Socket.IO handshake begins
3. Guard receives connection attempt
4. Guard extracts token from `handshake.auth.token`
5. Guard verifies JWT token
6. Guard allows connection
7. `handleConnection` is called
8. User joins room
9. Frontend receives `connect` event

**Failed connection flow:**
1. Frontend creates socket connection
2. Socket.IO handshake begins
3. Guard receives connection attempt
4. Guard fails (no token / invalid token)
5. Guard emits `auth_error` event
6. Guard disconnects socket
7. Frontend receives `connect_error` or `auth_error`
8. Error: "WebSocket is closed before the connection is established"

### 8. Quick Fixes

1. **Restart both services:**
   ```bash
   # Socket service
   cd transaction-socket-service
   npm run start:dev
   
   # Frontend
   cd user-frontend1
   npm run dev
   ```

2. **Clear and re-login:**
   - Clear localStorage
   - Logout and login again
   - Get fresh token

3. **Verify JWT_SECRET:**
   - Check all services use same secret
   - Update if needed
   - Restart services

4. **Check token manually:**
   ```javascript
   // In browser console
   const token = localStorage.getItem('token');
   const parts = token.split('.');
   if (parts.length === 3) {
     const payload = JSON.parse(atob(parts[1]));
     console.log('Token payload:', payload);
     console.log('Expires:', new Date(payload.exp * 1000));
     console.log('User ID:', payload.userId);
   }
   ```

### 9. What to Check Next

Based on the logs you see:

- **No logs in socket service** → Service not running or connection blocked
- **"No token found"** → Token not being sent correctly
- **"Token verification failed"** → JWT_SECRET mismatch or invalid token
- **"TokenExpiredError"** → Token expired, need to login again
- **Connection error with no guard logs** → CORS or network issue
