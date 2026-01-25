# Notification Integration Guide

This guide explains how the notification bell icon feature is integrated into the user-frontend.

## Overview

The notification feature provides:
- Real-time notification bell icon with unread count badge
- Dropdown notification list with all notifications
- Mark as read / Mark all as read functionality
- Delete notifications
- Auto-refresh of unread count every 30 seconds
- Click to navigate to action URLs (if available in metadata)

## Files Created

### 1. Notification Service (`src/lib/notification.service.ts`)
- API client for all notification endpoints
- Handles authentication with JWT tokens
- Methods for fetching, marking as read, deleting notifications

### 2. Notification Hook (`src/hooks/useNotifications.ts`)
- React hook for managing notification state
- Auto-refreshes unread count
- Provides methods for notification operations

### 3. Notification Bell Component (`src/components/NotificationBell.tsx`)
- Bell icon with unread count badge
- Dropdown notification list
- Interactive notification items with actions

## Environment Variables

Add to your `.env.local` or `.env` file:

```env
NEXT_PUBLIC_NOTIFICATION_API_URL=http://localhost:3004
```

## API Endpoints Used

The component uses the following endpoints from the notification-service:

- `GET /notifications?userId=xxx` - Get notifications
- `GET /notifications/unread-count?userId=xxx` - Get unread count
- `PATCH /notifications/:id/read?userId=xxx` - Mark as read
- `PATCH /notifications/mark-all-read?userId=xxx` - Mark all as read
- `DELETE /notifications/:id?userId=xxx` - Delete notification

## Features

### Bell Icon
- Shows unread count badge (red circle with number)
- Badge shows "99+" if count exceeds 99
- Click to open/close dropdown

### Notification Dropdown
- Shows up to 20 most recent notifications
- Unread notifications highlighted with blue background
- Shows notification type icon, title, message, priority, and time
- Click notification to mark as read and navigate (if actionUrl in metadata)
- Delete button (X) on each notification
- "Mark all as read" button in header

### Auto-refresh
- Unread count refreshes every 30 seconds
- Notifications list refreshes on component mount

## User ID Handling

The notification service automatically:
1. Gets userId from localStorage (if stored)
2. Decodes userId from JWT token
3. Stores userId in localStorage for future use

The hook also stores userId from UserContext when available.

## Styling

Uses Tailwind CSS classes. The component is fully responsive and matches the existing design system.

## Usage

The NotificationBell component is already integrated into `UserLayout.tsx`. No additional setup needed if environment variables are configured.

## Troubleshooting

**Notifications not loading?**
- Check `NEXT_PUBLIC_NOTIFICATION_API_URL` is set correctly
- Verify notification-service is running on the configured port
- Check browser console for errors
- Verify JWT token is valid and contains userId

**Unread count not updating?**
- Check network tab to see if API calls are successful
- Verify userId is being extracted correctly from token
- Check notification-service logs for errors
