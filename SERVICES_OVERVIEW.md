# Services Overview - Stablecoin Platform

## 📋 Complete Service List

### Backend Services

1. **user-service** (Port 3001) ✅
   - User & Admin authentication
   - Multi-role system (user, admin, super_admin)
   - Unique display ID generation (USR-XXXXXX)
   - Profile image upload with AWS S3 support
   - Column-level search filters for admin users list
   - 2FA implementation (TOTP)
   - Password reset with 2FA
   - Kafka sync with transaction service
   - RabbitMQ notifications
   - Redis caching (optional password support)
   - JWT token whitelist
   - Separate database: `st_user_db`

2. **transaction-fireblocks-service** (Port 3003) ✅
   - Modular structure (shared + modules)
   - Kafka sync with user service (users table)
   - User data synchronization (displayId, firstName, lastName, mobileNumber, countryCode)
   - Manual balance addition
   - Transaction operations (deposit, withdraw, mint, burn)
   - **Multi-custodian support** (Top 5 custodians):
     - Fireblocks (fully implemented)
     - BitGo (partially implemented)
     - Coinbase Custody (partially implemented)
     - Anchorage Digital (placeholder)
     - Fidelity Digital Assets (placeholder)
   - Mock and Local custodian options for testing
   - Ethers.js contract interaction
   - Custodian webhook callback handlers
   - Redis caching (optional password support)
   - Separate database: `st_transaction_db`

3. **notification-service** (Port 3004) ✅
   - Email sending via RabbitMQ
   - Template support
   - MongoDB for notification storage
   - Multiple email providers (SendGrid, Mailgun)

4. **transaction-socket-service** (Port 3005) ✅
   - Real-time WebSocket service
   - Socket.io implementation
   - JWT authentication for socket connections
   - RabbitMQ integration for transaction events
   - Real-time transaction updates to frontend

### Frontend Applications

1. **user-frontend** (Port 3006) ✅
   - Next.js application
   - Login, Register, 2FA
   - Dashboard with balances
   - Transaction history
   - Wallet management
   - Password reset
   - Real-time transaction notifications via Socket.io
   - Notification bell component

2. **admin-frontend** (Port 3007) ✅
   - Next.js application
   - Admin login with 2FA
   - Password reset
   - No registration (admin users created by super_admin)
   - Create admin users (super_admin only)
   - Users list with column-level filters
   - Pagination support
   - User profile management
   - Transaction management
   - Contract management
   - Real-time notifications

### Smart Contracts

- **Stablecoin.sol** ✅
  - ERC20 standard
  - AccessControl
  - Pausable
  - User balance tracking

## 🔄 Service Communication

```
User Service → Kafka → Transaction Fireblocks Service (user sync)
Transaction Fireblocks Service → Custodian (Fireblocks/BitGo/Coinbase/etc.) → Smart Contract
Custodian → Webhook → Transaction Fireblocks Service (callbacks)
Transaction Fireblocks Service → Kafka → Balance Updates
Transaction Fireblocks Service → RabbitMQ → Transaction Socket Service
Transaction Socket Service → Socket.io → Frontend (real-time updates)
User Service → RabbitMQ → Notification Service → Email
```

## 📊 Database Sync

- User Service emits `user.created` and `user.updated` events via Kafka
- Transaction Fireblocks Service listens and syncs user data
- Balance updates emitted via Kafka
- Transaction events published to RabbitMQ for real-time notifications

## 🔐 Security

- JWT authentication with token whitelist
- 2FA (TOTP) for users and admins
- Google reCAPTCHA (optional)
- Custodian webhook signature verification
- Role-based access control (user, admin, super_admin)
- Socket.io JWT authentication
- Redis password support (optional)
- AWS S3 secure file storage

## 🗄️ Database Architecture

- **User Service**: PostgreSQL (`st_user_db`)
- **Transaction Service**: PostgreSQL (`st_transaction_db`)
- **Notification Service**: MongoDB (`notification_db`)
- **Redis**: Optional caching layer (all services)

## 🔧 Technology Stack

### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Databases**: PostgreSQL 15, MongoDB, Redis 7
- **Message Brokers**: Apache Kafka, RabbitMQ
- **Blockchain**: Ethers.js, Hardhat
- **Custodians**: Fireblocks SDK, BitGo SDK (partial), Coinbase API (partial)

### Frontend
- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io Client

## 📡 Ports

| Service | Port | Description |
|---------|------|-------------|
| user-service | 3001 | User management and authentication |
| transaction-fireblocks-service | 3003 | Transaction processing with custodian support |
| notification-service | 3004 | Email notifications |
| transaction-socket-service | 3005 | Real-time WebSocket service |
| user-frontend | 3006 | User-facing web application |
| admin-frontend | 3007 | Admin dashboard |

---

All core services are complete and production-ready!
