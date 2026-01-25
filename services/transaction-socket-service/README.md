# Transaction Socket Service

A standalone NestJS microservice that provides real-time transaction status updates to users via WebSocket (Socket.IO).

## Architecture

```
Admin Frontend → transaction-fireblocks-service → RabbitMQ → transaction-socket-service → User Frontend
```

## Flow

1. **Admin approves/rejects transaction** in admin-frontend
2. **transaction-fireblocks-service** updates transaction status
3. **transaction-fireblocks-service** publishes event to RabbitMQ queue: `transaction-events`
4. **transaction-socket-service** consumes event from RabbitMQ
5. **transaction-socket-service** emits WebSocket event to user's private room: `user:{userId}`
6. **User Frontend** receives real-time update via Socket.IO

## Features

- ✅ JWT authentication for Socket.IO connections
- ✅ Private rooms per user: `user:{userId}`
- ✅ RabbitMQ event consumption
- ✅ Real-time transaction status updates
- ✅ CORS configuration
- ✅ Production-ready error handling

## Installation

```bash
npm install
```

## Configuration

Copy `env.example` to `.env` and configure:

```env
PORT=3005
JWT_SECRET=your-secret-key
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
CORS_ORIGIN=http://localhost:3006,http://localhost:3007
```

## Running

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start
```

## Events

### Emitted Events

- `TRANSACTION_APPROVED` - Transaction has been approved by admin
- `TRANSACTION_REJECTED` - Transaction has been rejected by admin
- `TRANSACTION_PENDING` - Transaction is pending approval
- `TRANSACTION_CONFIRMED` - Transaction has been confirmed

### Event Payload

```typescript
{
  transactionId: string;
  userId: string;
  transactionType: string; // 'deposit', 'withdraw', 'mint', 'burn'
  amount: string;
  status: string;
  txHash?: string;
  timestamp: string;
  reason?: string; // For rejected transactions
}
```

## Frontend Integration

See `EXAMPLES.md` for complete frontend integration examples.
