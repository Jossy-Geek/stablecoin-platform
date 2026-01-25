# Project Overview - Stablecoin Platform

## 🎯 Project Description

The Stablecoin Platform is a production-ready, enterprise-grade microservices-based blockchain platform for managing an Ethereum stablecoin pegged at a 1:1 ratio. The platform demonstrates advanced backend development, blockchain expertise, and system architecture skills through a comprehensive implementation of modern software engineering patterns.

## 🏗️ System Architecture

### Architecture Pattern
- **Microservices Architecture**: Service decomposition by business domain
- **Event-Driven Architecture**: Asynchronous communication via Kafka and RabbitMQ
- **API Gateway Pattern**: Single entry point for all clients (planned)
- **Custodian Provider Pattern**: Multi-custodian support for blockchain transactions
- **Real-time Communication**: WebSocket-based updates via Socket.io

### Core Components

#### Backend Services

1. **User Service** (Port 3001)
   - User and admin authentication and authorization
   - Multi-role system (user, admin, super_admin)
   - 2FA (TOTP) implementation
   - Profile management with AWS S3 support
   - JWT token management with whitelist
   - Database: PostgreSQL (`st_user_db`)

2. **Transaction Fireblocks Service** (Port 3003)
   - Transaction processing (mint, burn, deposit, withdraw)
   - Multi-custodian integration:
     - Fireblocks (fully implemented)
     - BitGo (partially implemented)
     - Coinbase Custody (partially implemented)
     - Anchorage Digital (placeholder)
     - Fidelity Digital Assets (placeholder)
   - Smart contract interaction via Ethers.js
   - Webhook handling for custodian callbacks
   - Database: PostgreSQL (`st_transaction_db`)

3. **Notification Service** (Port 3004)
   - Email notifications via RabbitMQ
   - Multiple email provider support (SendGrid, Mailgun)
   - Template-based email system
   - Database: MongoDB (`notification_db`)

4. **Transaction Socket Service** (Port 3005)
   - Real-time WebSocket service
   - Socket.io implementation
   - JWT authentication for socket connections
   - Real-time transaction updates to frontend

#### Frontend Applications

1. **User Frontend** (Port 3006)
   - Next.js application
   - User dashboard with balances
   - Transaction history
   - Real-time notifications
   - Wallet management

2. **Admin Frontend** (Port 3007)
   - Next.js application
   - Admin dashboard
   - User management with advanced filtering
   - Transaction management
   - Contract management

#### Infrastructure

- **PostgreSQL**: Primary relational database
- **MongoDB**: Notification storage
- **Redis**: Caching and session management (optional password support)
- **Apache Kafka**: Event streaming and asynchronous processing
- **RabbitMQ**: Message queue for notifications
- **Hardhat Node**: Local Ethereum blockchain for development
- **Docker & Docker Compose**: Containerization and orchestration

## 🔐 Security Features

- JWT authentication with token whitelist
- 2FA (TOTP) for users and admins
- Role-based access control (RBAC)
- Custodian webhook signature verification
- Socket.io JWT authentication
- Optional Redis password authentication
- AWS S3 secure file storage
- Google reCAPTCHA (optional)

## 💎 Smart Contracts

### Stablecoin Contract
- **Standard**: ERC20
- **Features**: 
  - AccessControl (role-based permissions)
  - Pausable (emergency pause functionality)
  - 1:1 Peg maintenance
  - Mint/Burn operations
  - User balance tracking

### Roles
- `DEFAULT_ADMIN_ROLE`: Full administrative control
- `MINTER_ROLE`: Can mint new tokens
- `BURNER_ROLE`: Can burn tokens
- `PAUSER_ROLE`: Can pause/unpause the contract

## 🔄 Data Flow

### User Registration Flow
1. User registers via User Service
2. User Service creates user in PostgreSQL
3. User Service emits `user.created` event to Kafka
4. Transaction Service consumes event and syncs user data
5. Notification Service sends welcome email via RabbitMQ

### Transaction Flow
1. User initiates transaction via Transaction Service
2. Transaction Service creates transaction record
3. Transaction Service submits to custodian (Fireblocks/BitGo/etc.)
4. Custodian executes transaction on blockchain
5. Custodian sends webhook callback to Transaction Service
6. Transaction Service updates database and emits Kafka events
7. Transaction Socket Service receives RabbitMQ event
8. Socket.io broadcasts real-time update to frontend

## 📊 Key Features

### Implemented Features
- ✅ Multi-role authentication system
- ✅ 2FA implementation
- ✅ Multi-custodian support
- ✅ Real-time transaction notifications
- ✅ Event-driven architecture
- ✅ Retry mechanism with DLQ
- ✅ Smart contract integration
- ✅ AWS S3 file storage
- ✅ Advanced user filtering
- ✅ Redis caching
- ✅ Kafka-based service synchronization

### Architecture Patterns
- ✅ Microservices architecture
- ✅ Event-driven communication
- ✅ CQRS pattern
- ✅ Retry pattern with exponential backoff
- ✅ Circuit breaker pattern
- ✅ Custodian provider pattern
- ✅ Real-time communication pattern

## 🛠️ Technology Stack

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

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin Contracts

## 📡 Service Communication

```
User Service → Kafka → Transaction Fireblocks Service (user sync)
Transaction Fireblocks Service → Custodian → Smart Contract
Custodian → Webhook → Transaction Fireblocks Service
Transaction Fireblocks Service → Kafka → Balance Updates
Transaction Fireblocks Service → RabbitMQ → Transaction Socket Service
Transaction Socket Service → Socket.io → Frontend
User Service → RabbitMQ → Notification Service → Email
```

## 🗄️ Database Architecture

- **User Service**: PostgreSQL (`st_user_db`)
  - Users, roles, 2FA, password resets
  
- **Transaction Service**: PostgreSQL (`st_transaction_db`)
  - Transactions, balances, user sync data
  
- **Notification Service**: MongoDB (`notification_db`)
  - Notification records
  
- **Redis**: Optional caching (all services)
  - Session management
  - Token whitelist
  - Cache layer

## 🚀 Deployment

### Development
- Docker Compose for local development
- Hardhat node for local blockchain
- All services run in containers

### Production Considerations
- Managed databases (AWS RDS, Azure Database)
- Managed Redis (AWS ElastiCache, Azure Cache)
- Managed Kafka (AWS MSK, Confluent Cloud)
- Production Ethereum node (Infura, Alchemy)
- Kubernetes-ready architecture

## 📈 Scalability

- Horizontal scaling support
- Load balancing ready
- Database connection pooling
- Redis caching for performance
- Event-driven architecture for decoupling

## 🔧 Configuration

### Environment Variables
Each service has its own `.env` file with service-specific configuration:
- Database connections
- Redis configuration (with optional password)
- Kafka brokers
- RabbitMQ URLs
- Custodian credentials
- JWT secrets
- AWS S3 credentials (optional)

## 📚 Documentation

- [README.md](./README.md) - Main project documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture diagrams
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [SERVICES_OVERVIEW.md](./SERVICES_OVERVIEW.md) - Services overview
- [SMART_CONTRACTS.md](./SMART_CONTRACTS.md) - Smart contract documentation

## 🎓 Learning Outcomes

This project demonstrates:
- Enterprise microservices architecture
- Blockchain and smart contract development
- Event-driven architecture patterns
- Multi-custodian integration
- Real-time communication
- Security best practices
- Production-ready code structure
- Docker containerization
- Database design and optimization

## 📞 Support

For questions or issues, please refer to the documentation files or open an issue in the repository.

---

**Note**: This is a comprehensive platform designed to showcase advanced backend development, blockchain expertise, and system architecture skills. It includes production-ready patterns but should be adapted for specific use cases.
