# Socket.IO Connection Troubleshooting Guide

## Common Issues and Solutions

### 1. Socket Not Connecting

#### Check Environment Variable
```bash
# Verify .env.local has:
NEXT_PUBLIC_SOCKET_URL=http://localhost:3005
```

**Note:** After adding/changing `.env.local`, you MUST restart the Next.js dev server:
```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

#### Verify Socket Service is Running
```bash
# Check if socket service is running on port 3005
curl http://localhost:3005
# Or check in browser: http://localhost:3005
```

#### Check Browser Console
Open browser DevTools (F12) and check Console tab for:
- Connection errors
- Authentication errors
- CORS errors
- Network errors

### 2. Authentication Errors

#### Verify JWT Token
```javascript
// In browser console:
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);
```

#### Verify JWT Secret Matches
- Socket service `JWT_SECRET` must match the service that issued the token
- Check `transaction-socket-service/.env` has correct `JWT_SECRET`
- Check `user-service` or `transaction-fireblocks-service` uses same secret

### 3. CORS Errors

#### Check CORS Configuration
Socket service `.env` should have:
```env
CORS_ORIGIN=http://localhost:3006,http://localhost:3007
```

#### Verify Frontend URL
- Frontend runs on `http://localhost:3006`
- Must be included in `CORS_ORIGIN` list

### 4. User ID Not Available

The hook will try to extract user ID from:
1. `user?.id` from UserContext (preferred)
2. JWT token payload (fallback)

Check browser console for:
```
✅ [Transaction Socket] Extracted user ID from token: xxx
```

### 5. Connection Status Indicators

**Green dot + "Real-time updates active"** = ✅ Connected
**Red dot + Error message** = ❌ Connection failed
**Red dot + "Connecting..."** = ⏳ Still connecting

### 6. Manual Testing

#### Test Socket Connection Directly
```javascript
// In browser console (on transactions page):
// Check if socket is connected
const socket = window.io?.('http://localhost:3005', {
  auth: { token: localStorage.getItem('token') }
});
socket.on('connect', () => console.log('Connected!'));
socket.on('connect_error', (err) => console.error('Error:', err));
```

### 7. Network Issues

#### Check Firewall/Port
```bash
# Windows
netstat -an | findstr :3005

# Linux/Mac
netstat -an | grep :3005
# or
lsof -i :3005
```

#### Test Socket Service Endpoint
```bash
# Test if service is reachable
curl -X POST http://localhost:3005/events \
  -H "Content-Type: application/json" \
  -d '{"eventType":"TEST","userId":"test","transactionId":"test"}'
```

### 8. Debug Checklist

- [ ] Socket service is running (`npm run start:dev` in transaction-socket-service)
- [ ] Socket service port is 3005 (check logs)
- [ ] `.env.local` has `NEXT_PUBLIC_SOCKET_URL=http://localhost:3005`
- [ ] Next.js dev server was restarted after adding env var
- [ ] User is logged in (token exists in localStorage)
- [ ] JWT_SECRET matches between services
- [ ] CORS_ORIGIN includes `http://localhost:3006`
- [ ] Browser console shows connection attempts
- [ ] No firewall blocking port 3005

### 9. Expected Console Output

**On successful connection:**
```
🔌 [Transaction Socket] Initializing connection...
🔌 [Transaction Socket] URL: http://localhost:3005
🔌 [Transaction Socket] User ID: xxx
🔌 [Socket] Creating new socket connection...
✅ [Transaction Socket] Connected successfully
✅ [Transaction Socket] Socket ID: xxx
```

**On connection failure:**
```
❌ [Transaction Socket] Connection error: ...
❌ [Socket] Connection error: ...
```

### 10. Quick Fixes

1. **Restart everything:**
   ```bash
   # Stop all services
   # Restart socket service
   cd transaction-socket-service && npm run start:dev
   
   # Restart frontend
   cd user-frontend1 && npm run dev
   ```

2. **Clear browser cache and localStorage:**
   - Open DevTools → Application → Local Storage
   - Clear all
   - Refresh page and login again

3. **Check JWT token validity:**
   - Token might be expired
   - Try logging out and logging in again

4. **Verify socket service logs:**
   - Check socket service console for connection attempts
   - Look for authentication errors
   - Verify user room joining
