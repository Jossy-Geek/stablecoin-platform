# Socket Connection Debugging Guide

## Current Issue
Frontend is attempting to connect to `ws://localhost:3005/socket.io/?EIO=4&transport=websocket` but connection is failing.

## Debugging Steps

### 1. Check Socket Service Logs

When a connection attempt is made, you should see logs like:

```
🔐 [Auth Guard] ========== NEW CONNECTION ATTEMPT ==========
🔐 [Auth Guard] Socket ID: <socket-id>
🔐 [Auth Guard] Handshake auth: { ... }
```

**If you DON'T see these logs:**
- Connection is being blocked before reaching the guard
- Check CORS configuration
- Check if service is running on port 3005

**If you see authentication errors:**
- Check JWT_SECRET matches between services
- Check token is being sent correctly

### 2. Verify JWT_SECRET Matches

**Critical:** The `JWT_SECRET` in `transaction-socket-service/.env` MUST match the secret used to sign tokens in:
- `user-service` (if that's where login happens)
- `transaction-fireblocks-service` (if tokens are issued there)

**Check JWT_SECRET:**
```bash
# In transaction-socket-service
cat .env | grep JWT_SECRET

# Compare with other services
# Make sure they all use the SAME secret
```

### 3. Verify CORS Configuration

**Check `.env` file:**
```env
CORS_ORIGIN=http://localhost:3006,http://localhost:3007
```

**Verify frontend URL:**
- Frontend should be running on `http://localhost:3006`
- Must be in the CORS_ORIGIN list

### 4. Test Token Extraction

The guard looks for token in:
1. `handshake.auth.token` (preferred - this is where Socket.IO client sends it)
2. `handshake.headers.authorization` (fallback)

**Check frontend is sending token correctly:**
```javascript
// In browser console on transactions page
const socket = io('http://localhost:3005', {
  auth: { token: localStorage.getItem('token') }
});
console.log('Token:', localStorage.getItem('token'));
```

### 5. Common Issues

#### Issue: "No token found"
**Symptoms:** Logs show `❌ [Auth Guard] No token found`
**Solution:**
- Verify token exists in localStorage: `localStorage.getItem('token')`
- Check frontend is sending token in `auth` object
- Verify token is not expired

#### Issue: "Token verification failed"
**Symptoms:** Logs show `❌ [Auth Guard] Token verification failed`
**Solution:**
- **Most common:** JWT_SECRET mismatch between services
- Check token is valid JWT format
- Check token hasn't expired
- Verify JWT_SECRET is set correctly in `.env`

#### Issue: Connection never reaches guard
**Symptoms:** No logs at all when connection attempted
**Solution:**
- Check CORS configuration
- Check service is running: `curl http://localhost:3005`
- Check firewall/port blocking
- Verify WebSocket upgrade is allowed

### 6. Manual Connection Test

**In browser console (on transactions page):**
```javascript
// Load socket.io client
const io = require('socket.io-client');

// Get token
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);

// Try to connect
const socket = io('http://localhost:3005', {
  auth: { token: token },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected! Socket ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
  console.error('Error type:', error.type);
  console.error('Error message:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

### 7. Expected Log Flow

**Successful connection:**
```
🔐 [Auth Guard] ========== NEW CONNECTION ATTEMPT ==========
🔍 [Auth Guard] Extracting token from socket...
✅ [Auth Guard] Token extracted successfully
🔐 [Auth Guard] Verifying JWT token...
✅ [Auth Guard] ========== AUTHENTICATION SUCCESS ==========
🔌 [Socket Gateway] ========== CONNECTION RECEIVED ==========
✅ [Socket] User authenticated: <userId>
✅ [Socket] Joined room: user:<userId>
```

**Failed connection (no token):**
```
🔐 [Auth Guard] ========== NEW CONNECTION ATTEMPT ==========
🔍 [Auth Guard] Extracting token from socket...
⚠️  [Auth Guard] No valid token found in handshake
❌ [Auth Guard] ========== AUTHENTICATION FAILED ==========
```

**Failed connection (invalid token):**
```
🔐 [Auth Guard] ========== NEW CONNECTION ATTEMPT ==========
🔍 [Auth Guard] Extracting token from socket...
✅ [Auth Guard] Token extracted successfully
🔐 [Auth Guard] Verifying JWT token...
❌ [Auth Guard] ========== TOKEN VERIFICATION FAILED ==========
❌ [Auth Guard] Error message: <error message>
```

### 8. Quick Fixes

1. **Restart socket service** after changing `.env`:
   ```bash
   cd transaction-socket-service
   npm run start:dev
   ```

2. **Verify JWT_SECRET matches:**
   - Check all services use the same secret
   - Update `.env` files if needed
   - Restart all services

3. **Clear browser cache:**
   - Clear localStorage
   - Logout and login again to get fresh token

4. **Check service is running:**
   ```bash
   # Should return something
   curl http://localhost:3005
   ```

### 9. Network Debugging

**Check if port is open:**
```bash
# Windows
netstat -an | findstr :3005

# Linux/Mac
lsof -i :3005
```

**Test WebSocket connection:**
```bash
# Using wscat (install: npm install -g wscat)
wscat -c ws://localhost:3005/socket.io/?EIO=4&transport=websocket
```

### 10. Next Steps

1. Check socket service console logs when connection is attempted
2. Look for the specific error message in logs
3. Compare JWT_SECRET between services
4. Verify token is valid and not expired
5. Check CORS configuration matches frontend URL
