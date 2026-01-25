# Demo Events Guide

## Issue: "User is not connected. Event will not be delivered."

### Problem
When demo events are enabled, you may see this warning:
```
⚠️  [Socket] User 00000000-0000-0000-0000-000000000002 is not connected. Event will not be delivered.
```

This happens because:
1. Demo events use a hardcoded user ID (`00000000-0000-0000-0000-000000000002`)
2. Your actual logged-in user has a different ID
3. The socket service tries to emit events to the demo user ID, but that user is not connected

### Solution

#### Option 1: Use Your Actual User ID (Recommended)

1. **Find your user ID:**
   - Check browser console when connecting to socket
   - Look for: `✅ [Socket] User authenticated: <your-user-id>`
   - Or check JWT token payload in browser console

2. **Set DEMO_USER_ID in `.env`:**
   ```env
   DEMO_USER_ID=<your-actual-user-id>
   ```

3. **Restart the service:**
   ```bash
   cd transaction-fireblocks-service
   npm run start:dev
   ```

#### Option 2: Disable Demo Events

If you don't need demo events for testing:

1. **Set in `.env`:**
   ```env
   ENABLE_DEMO_SOCKET_EVENTS=false
   ```

2. **Restart the service**

#### Option 3: Check Connected Users

The socket service now logs all connected users. Check the socket service console for:
```
📊 [Socket] Currently connected user IDs: [ 'user-id-1', 'user-id-2', ... ]
```

### How It Works

1. **Demo Events:**
   - Triggered automatically when `ENABLE_DEMO_SOCKET_EVENTS=true`
   - Emit 5 test transaction events (PENDING, APPROVED, REJECTED, CONFIRMED, etc.)
   - Use `DEMO_USER_ID` or default to `00000000-0000-0000-0000-000000000002`

2. **Real Events:**
   - Triggered when actual transactions occur (mint, burn, deposit, withdraw)
   - Use the actual user ID from the transaction
   - Will be delivered if that user is connected

### Testing

1. **Connect to socket service:**
   - Open frontend and navigate to transactions page
   - Check browser console for: `✅ [Transaction Socket] Connected successfully`
   - Check socket service console for: `✅ [Socket] User authenticated: <user-id>`

2. **Verify user ID matches:**
   - Note your user ID from connection logs
   - Set `DEMO_USER_ID` to match your user ID
   - Restart `transaction-fireblocks-service`
   - Demo events should now be delivered

3. **Check event delivery:**
   - Watch browser console for transaction update events
   - Watch socket service console for: `✅ [Socket] Event emitted to room: user:<user-id>`

### Environment Variables

```env
# Enable/disable demo events
ENABLE_DEMO_SOCKET_EVENTS=true

# Optional: Set to your actual user ID to receive demo events
# If not set, defaults to '00000000-0000-0000-0000-000000000002'
DEMO_USER_ID=00000000-0000-0000-0000-000000000002
```

### Expected Logs

**When user connects:**
```
✅ [Socket] User authenticated: <user-id> (<email>)
📊 [Socket] Currently connected user IDs: [ '<user-id>' ]
```

**When demo events are emitted:**
```
🧪 [Demo Events] Demo User ID: <demo-user-id>
📤 [Socket] Target user: <demo-user-id>
📤 [Socket] User connected: ✅ Yes (or ❌ No)
```

**If user is not connected:**
```
⚠️  [Socket] User <user-id> is not connected. Event will not be delivered.
⚠️  [Socket] Currently connected users: [ '<actual-user-id>' ]
```

### Troubleshooting

**Q: Events not being received?**
- Check if your user ID matches `DEMO_USER_ID`
- Verify you're connected: Check socket service logs for your user ID
- Check browser console for connection status

**Q: How to find my user ID?**
- Browser console: Look for `✅ [Transaction Socket] User ID: <id>`
- Socket service logs: Look for `✅ [Socket] User authenticated: <id>`
- JWT token: Decode token payload to get `userId`

**Q: Can I test with multiple users?**
- Yes, but demo events only go to one user (DEMO_USER_ID)
- Real transaction events go to the user who created the transaction
- Each user connects to their own room: `user:<user-id>`
