# In-App Notifications API

This document describes the in-app notification feature for the notification-service. Notifications are stored in MongoDB and can be displayed in the user-frontend and admin-frontend via a bell icon.

## Overview

The notification system provides:
- **In-app notifications** stored in MongoDB
- **REST API endpoints** for managing notifications
- **Automatic notification creation** when transaction events occur
- **Rich metadata** for displaying detailed information

## Notification Model

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | Yes | User ID who receives the notification |
| `title` | String | Yes | Notification title |
| `message` | String | Yes | Notification message/body |
| `type` | Enum | No | Type: `transaction`, `system`, `security`, `account`, `wallet`, `other` (default: `other`) |
| `status` | Enum | No | Status: `unread`, `read`, `archived` (default: `unread`) |
| `priority` | Enum | No | Priority: `low`, `medium`, `high`, `urgent` (default: `medium`) |
| `metadata` | Object | No | Generic metadata object for storing any additional data (transactionId, amount, currency, txHash, reason, actionUrl, or any custom fields) |
| `readAt` | Date | No | Timestamp when notification was marked as read |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

### Metadata Structure

The `metadata` field is a generic object that can store any key-value pairs. It's flexible and can be used for different notification types:

**Example for Transaction notifications:**
```json
{
  "transactionId": "string",
  "transactionType": "deposit|withdraw|mint|burn",
  "transactionStatus": "pending|confirmed|rejected",
  "amount": "string",
  "currency": "USD",
  "txHash": "string",
  "reason": "string",
  "actionUrl": "/transactions/123"
}
```

**Example for System notifications:**
```json
{
  "maintenanceDate": "2026-01-20",
  "actionUrl": "/maintenance",
  "affectedServices": ["api", "database"]
}
```

**Example for Security notifications:**
```json
{
  "eventType": "login_attempt",
  "ipAddress": "192.168.1.1",
  "location": "New York, US",
  "actionUrl": "/security"
}
```

The metadata field is completely flexible and can contain any custom fields needed for your notification type.

## API Endpoints

Base URL: `http://localhost:3004/notifications`

### 1. Get Notifications

Get notifications for a user with optional filters.

**GET** `/notifications`

**Query Parameters:**
- `userId` (required): User ID
- `status` (optional): Filter by status (`unread`, `read`, `archived`)
- `type` (optional): Filter by type (`transaction`, `system`, etc.)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`, `urgent`)
- `limit` (optional): Limit results (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "notification-id",
      "userId": "user-id",
      "title": "Transaction Deposit Confirmed",
      "message": "Your deposit transaction has been confirmed successfully. Amount: 100 USD",
      "type": "transaction",
      "status": "unread",
      "priority": "medium",
      "metadata": {
        "transactionId": "tx-123",
        "transactionType": "deposit",
        "transactionStatus": "confirmed",
        "amount": "100",
        "currency": "USD",
        "actionUrl": "/transactions/tx-123"
      },
      "readAt": null,
      "createdAt": "2026-01-18T12:00:00.000Z",
      "updatedAt": "2026-01-18T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0
  },
  "unreadCount": 5
}
```

### 2. Get Unread Count

Get the count of unread notifications for a user.

**GET** `/notifications/unread-count?userId=user-id`

**Response:**
```json
{
  "success": true,
  "unreadCount": 5
}
```

### 3. Get Single Notification

Get a specific notification by ID.

**GET** `/notifications/:id?userId=user-id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "notification-id",
    "userId": "user-id",
    "title": "Transaction Deposit Confirmed",
    "message": "Your deposit transaction has been confirmed successfully.",
    "type": "transaction",
    "status": "unread",
    "priority": "medium",
    "metadata": { ... },
    "createdAt": "2026-01-18T12:00:00.000Z",
    "updatedAt": "2026-01-18T12:00:00.000Z"
  }
}
```

### 4. Create Notification

Create a new notification manually.

**POST** `/notifications`

**Request Body:**
```json
{
  "userId": "user-id",
  "title": "System Maintenance",
  "message": "Scheduled maintenance will occur on January 20th",
  "type": "system",
  "priority": "high",
  "metadata": {
    "maintenanceDate": "2026-01-20",
    "actionUrl": "/maintenance"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "notification-id",
    "userId": "user-id",
    "title": "System Maintenance",
    "message": "Scheduled maintenance will occur on January 20th",
    "type": "system",
    "status": "unread",
    "priority": "high",
    "metadata": { ... },
    "createdAt": "2026-01-18T12:00:00.000Z",
    "updatedAt": "2026-01-18T12:00:00.000Z"
  },
  "message": "Notification created successfully"
}
```

### 5. Mark as Read

Mark a notification as read.

**PATCH** `/notifications/:id/read?userId=user-id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "notification-id",
    "status": "read",
    "readAt": "2026-01-18T12:05:00.000Z",
    ...
  },
  "message": "Notification marked as read"
}
```

### 6. Mark All as Read

Mark all notifications as read for a user.

**PATCH** `/notifications/mark-all-read?userId=user-id`

**Response:**
```json
{
  "success": true,
  "message": "Marked 5 notifications as read",
  "count": 5
}
```

### 7. Archive Notification

Archive a notification.

**PATCH** `/notifications/:id/archive?userId=user-id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "notification-id",
    "status": "archived",
    ...
  },
  "message": "Notification archived"
}
```

### 8. Delete Notification

Delete a notification.

**DELETE** `/notifications/:id?userId=user-id`

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

## Automatic Notification Creation

When transaction events are received via RabbitMQ, the service automatically:
1. Sends an email notification (if email is configured)
2. Creates an in-app notification in MongoDB

### Transaction Event Format

The service listens to the `transaction-events` queue and expects events in this format:

```json
{
  "transactionId": "tx-123",
  "userId": "user-id",
  "userEmail": "user@example.com",
  "transactionType": "deposit",
  "status": "pending|confirmed|rejected",
  "amount": "100",
  "currency": "USD",
  "txHash": "0x...",
  "reason": "Optional rejection reason"
}
```

### Notification Types by Status

- **Pending**: `priority: medium`, title: "Transaction {type} Pending"
- **Confirmed**: `priority: low`, title: "Transaction {type} Confirmed"
- **Rejected**: `priority: high`, title: "Transaction {type} Rejected"

## Frontend Integration

### Example: Fetch Notifications

```typescript
// Fetch notifications for current user
const response = await fetch(
  `http://localhost:3004/notifications?userId=${userId}&status=unread&limit=20`
);
const data = await response.json();
const notifications = data.data;
const unreadCount = data.unreadCount;
```

### Example: Mark as Read

```typescript
await fetch(
  `http://localhost:3004/notifications/${notificationId}/read?userId=${userId}`,
  { method: 'PATCH' }
);
```

### Example: Display Bell Icon Badge

```typescript
// Get unread count
const response = await fetch(
  `http://localhost:3004/notifications/unread-count?userId=${userId}`
);
const { unreadCount } = await response.json();

// Display badge
<BellIcon>
  {unreadCount > 0 && <Badge count={unreadCount} />}
</BellIcon>
```

## Database Indexes

The following indexes are created for optimal query performance:
- `userId + status + createdAt` (for user notifications with status filter)
- `userId + type + createdAt` (for filtering by type)
- `userId + priority + createdAt` (for filtering by priority)
- `status + createdAt` (for global status queries)
- `metadata.transactionId` (for transaction lookups)

## Error Handling

All endpoints return a consistent error format:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Notes

- Notifications are automatically created when transaction events are received
- Notifications are user-specific (filtered by `userId`)
- Notifications support pagination via `limit` and `offset`
- The `metadata` field is flexible and can store any additional data needed for display
