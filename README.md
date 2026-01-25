# Stablecoin Platform - Sample Project

A sample stablecoin platform demonstrating microservices architecture for managing an Ethereum stablecoin pegged at a 1:1 ratio. Built with NestJS, Hardhat, and smart contracts showcasing modern development practices and enterprise-level architecture patterns.

**This is a portfolio/showcase project** designed to demonstrate backend development, blockchain expertise, and system architecture skills for potential clients and freelance opportunities.

## ⚠️ Security Notice

**IMPORTANT**: This repository contains example credentials for demonstration purposes only.

- **NEVER** commit real API keys, passwords, or secrets
- **ALWAYS** use `.env` files for sensitive configuration (already in `.gitignore`)
- **REPLACE** all example credentials before production use
- The credentials shown in this README are for **local development only**
- All `.env` files are excluded from version control

## 🎯 Project Overview

This is a **sample/portfolio project** that demonstrates my capabilities in building scalable microservices-based blockchain platforms. It showcases:

- **Backend Development Skills**: Full-stack microservices architecture with NestJS
- **Blockchain Expertise**: Smart contract development, ERC20 tokens, and Web3 integration
- **System Architecture**: Event-driven design, message queuing, and real-time communication
- **DevOps Knowledge**: Docker containerization, service orchestration, and deployment strategies

**Perfect for**: Potential clients looking for developers experienced in blockchain, microservices, and modern backend technologies.

**Note**: This is a demonstration project. All credentials and configurations are for development/testing purposes only.

## 🏗️ Architecture

The system follows a microservices architecture pattern with the following components:

- **User Service**: User management and authentication
- **Transaction Fireblocks Service**: Transaction processing with multi-custodian support
- **Notification Service**: Email notifications via RabbitMQ
- **Transaction Socket Service**: Real-time WebSocket service for transaction updates
- **Smart Contracts**: ERC20 stablecoin with AccessControl and Pausable

## 🚀 Tech Stack

### Blockchain & Smart Contracts
- **Solidity** (^0.8.20) - Smart contract language
- **Hardhat** - Development environment
- **OpenZeppelin** - Secure contract libraries
- **Ethers.js** - Ethereum library
- **ERC20** - Token standard
- **AccessControl** - Role-based access control
- **Pausable** - Emergency pause functionality

### Backend Framework
- **NestJS** (v10.x) - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Express** - Web framework

### Databases & Caching
- **PostgreSQL** (v15) - Primary relational database
- **MongoDB** - Notification storage
- **Redis** (v7) - Caching and session management (optional password support)
- **TypeORM** - Object-Relational Mapping

### Message Brokers
- **Apache Kafka** - Event streaming and asynchronous processing
- **RabbitMQ** - Message queue for notifications

### Real-time Communication
- **Socket.io** - WebSocket-based real-time notifications

### Infrastructure
- **Docker** & **Docker Compose** - Containerization and orchestration
- **Kubernetes-ready** - Designed for cloud deployment

### Development Tools
- **Swagger/OpenAPI** - API documentation
- **ESLint** & **Prettier** - Code quality
- **Jest** - Testing framework

## 📋 Prerequisites

- Node.js (v18.x or higher)
- Docker & Docker Compose
- PostgreSQL client (optional)
- Git
- MetaMask or Web3 wallet (for contract interaction)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stablecoin-platform
```

### 2. Environment Configuration

Copy the `.env.example` files from each service directory:

```bash
# Copy example files
cp services/user-service/env.example services/user-service/.env
cp services/transaction-fireblocks-service/env.example services/transaction-fireblocks-service/.env
cp services/notification-service/env.example services/notification-service/.env
cp services/transaction-socket-service/env.example services/transaction-socket-service/.env
cp contracts/.env.example contracts/.env
```

### 3. Start Infrastructure Services

```bash
docker-compose up -d postgres-user postgres-transaction redis kafka zookeeper rabbitmq hardhat-node
```

Wait for all services to be healthy.

### 4. Database Setup

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

Quick setup:
```bash
docker-compose exec -T postgres psql -U postgres -d stablecoin_db < database/init.sql
```

### 5. Deploy Smart Contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network localhost
```

### 6. Install Dependencies

```bash
# Install dependencies for each service
cd services/user-service && npm install && cd ../..
cd services/transaction-fireblocks-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
cd services/transaction-socket-service && npm install && cd ../..
cd contracts && npm install && cd ..
```

### 7. Start Services

#### Option A: Docker Compose (Recommended)

```bash
docker-compose up --build
```

#### Option B: Local Development

```bash
# Start each service in separate terminals
cd services/user-service && npm run start:dev
cd services/transaction-fireblocks-service && npm run start:dev
cd services/notification-service && npm run start:dev
cd services/transaction-socket-service && npm run start:dev
```

## 🔐 Default Login Credentials

After database setup, you can use these credentials:

| Role | Email | Password | Display ID | First Name | Last Name |
|------|-------|----------|------------|------------|-----------|
| Super Admin | admin@stablecoin.com | Admin@123 | USR-000001 | John | Admin |
| User | user@stablecoin.com | User@123 | USR-000002 | Jane | Doe |
| User | alice@stablecoin.com | User@123 | USR-000003 | Alice | Smith |
| Admin | admin2@stablecoin.com | Admin@123 | USR-000004 | Bob | Manager |

**Note**: 
- Admin users cannot be registered from the login page. They must be created by a super_admin user after logging in.
- All users have sample balances and transactions in the transaction database for testing.
- See [SAMPLE_DATA.md](./database/SAMPLE_DATA.md) for complete sample data details.

## 📡 API Endpoints

### API Gateway
- Base URL: `http://localhost:3000`
- Swagger Documentation: `http://localhost:3000/api/docs`

### Service Ports
- User Service: `3001`
- Transaction Fireblocks Service: `3003`
- Notification Service: `3004`
- Transaction Socket Service: `3005`
- User Frontend: `3006`
- Admin Frontend: `3007`

## 🔄 Kafka Topics

### Event Topics
- `user.created` - User registration events
- `user.updated` - User profile updates
- `wallet.created` - Wallet creation events
- `wallet.balance.updated` - Balance update events
- `transaction.created` - Transaction creation
- `transaction.processed` - Transaction processing
- `transaction.failed` - Failed transactions
- `stablecoin.minted` - Stablecoin minting events
- `stablecoin.burned` - Stablecoin burning events

### Retry Topics
- `user-retry` - User service retry queue
- `transaction-retry` - Transaction service retry queue

### Dead Letter Queues (DLQ)
- `user-dlq` - Failed user operations
- `transaction-dlq` - Failed transaction operations

## 🐰 RabbitMQ Queues

- `notifications` - Notification messages
- `email-notifications` - Email notification queue
- `transaction-notifications` - Transaction notification queue

## 💎 Smart Contracts

### Stablecoin Contract Features
- **ERC20 Standard** - Full ERC20 token implementation
- **AccessControl** - Role-based permissions (MINTER, BURNER, PAUSER, ADMIN)
- **Pausable** - Emergency pause functionality
- **1:1 Peg** - Maintains 1:1 ratio with backing asset
- **Mint/Burn** - Controlled minting and burning
- **User Balance Tracking** - On-chain balance management

### Contract Addresses
After deployment, contract addresses will be stored in:
- `contracts/deployments/localhost/Stablecoin.json`

## 📊 Features

### Implemented Features
- ✅ User authentication and authorization (JWT with token whitelist)
- ✅ Multi-role system (user, admin, super_admin) with role-based access control
- ✅ Unique display ID generation (USR-XXXXXX format)
- ✅ Profile image upload with AWS S3 support and access control
- ✅ Column-level search filters in admin users list
- ✅ Pagination with advanced filtering
- ✅ User balance tracking (on-chain + off-chain)
- ✅ Transaction processing with retry mechanism
- ✅ **Multi-custodian support** (Fireblocks, BitGo, Coinbase, Anchorage, Fidelity)
- ✅ Smart contract integration (ERC20, AccessControl, Pausable)
- ✅ Real-time transaction notifications via Socket.io
- ✅ Event-driven architecture with Kafka
- ✅ Message queuing with RabbitMQ
- ✅ Redis caching (optional password support)
- ✅ Error handling and retry logic
- ✅ Dead Letter Queue (DLQ) for failed messages
- ✅ Separate databases for user and transaction services
- ✅ MongoDB for notification storage
- ✅ Kafka-based user data synchronization between services
- ✅ Swagger API documentation

### Architecture Patterns
- ✅ Microservices architecture
- ✅ Event-driven communication
- ✅ CQRS (Command Query Responsibility Segregation)
- ✅ Retry pattern with exponential backoff
- ✅ Circuit breaker pattern (via retry mechanism)
- ✅ API Gateway pattern
- ✅ Smart contract integration pattern

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
npx hardhat test
```

### Backend Services
```bash
# Run tests for a specific service
cd services/user-service
npm test

# Run tests with coverage
npm run test:cov
```

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deployment

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

## 📚 Documentation

- [SERVICES_OVERVIEW.md](./SERVICES_OVERVIEW.md) - Complete services overview
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture documentation
- [SMART_CONTRACTS.md](./SMART_CONTRACTS.md) - Smart contract documentation

## 🏛️ System Architecture Diagram

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture diagrams.

## 🔧 Configuration

### Environment Variables

Each service has its own `.env` file. See individual service directories for configuration options.

Key environment variables:
- `DATABASE_HOST` - PostgreSQL host
- `DATABASE_PORT` - PostgreSQL port
- `DATABASE_USER` - Database username
- `DATABASE_PASSWORD` - Database password
- `DATABASE_NAME` - Database name (st_user_db or st_transaction_db)
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `REDIS_PASSWORD` - Redis password (optional, leave empty if not using password)
- `KAFKA_BROKER` - Kafka broker address
- `RABBITMQ_URL` - RabbitMQ connection URL
- `JWT_SECRET` - JWT secret key
- `ETHEREUM_RPC_URL` - Ethereum RPC endpoint
- `CONTRACT_ADDRESS` - Deployed contract address
- `IS_VAULT_ENABLED` - Enable custodian services (true/false)
- `CUSTODIAN_PROVIDER` - Custodian provider (fireblocks, bitgo, coinbase_custody, anchorage, fidelity, mock, local)
- `VAULT_API_KEY` - Fireblocks API key (when using Fireblocks)
- `VAULT_API_SECRET_KEY_PATH` - Path to Fireblocks secret key file
- `USE_S3_UPLOAD` - Enable AWS S3 for file uploads (true/false)
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_S3_BUCKET` - S3 bucket name
- `AWS_S3_REGION` - S3 region
- `UPLOAD_DIR` - Local upload directory (fallback if S3 disabled)
- `BASE_URL` - Base URL for file serving

## 🤝 For Potential Clients

This project serves as a **portfolio demonstration** of my technical capabilities. It showcases:

✅ **Production-ready code patterns** (adapted for your specific needs)  
✅ **Scalable architecture** that can handle enterprise-level requirements  
✅ **Modern tech stack** aligned with industry best practices  
✅ **Comprehensive documentation** for easy onboarding and maintenance  
✅ **Docker deployment** ready for quick setup and testing  

**What I can deliver for your project:**
- Custom blockchain and DeFi solutions
- Microservices architecture design and implementation
- Smart contract development and auditing
- Backend API development with modern frameworks
- System integration with existing infrastructure
- Performance optimization and scaling strategies

**Contact**: Available for freelance projects, contract work, and consulting opportunities.

## 📄 License

MIT License - Feel free to use this project for learning and portfolio purposes.

## 👨‍💻 About the Developer

**Available for freelance projects and contract work**

This project demonstrates expertise in:
- **Backend Development**: NestJS, TypeScript, Node.js, REST APIs, GraphQL
- **Blockchain Development**: Solidity, Smart Contracts, Web3, Ethereum
- **System Architecture**: Microservices, Event-Driven Architecture, Message Queues
- **DevOps**: Docker, Docker Compose, CI/CD, Service Orchestration
- **Databases**: PostgreSQL, MongoDB, Redis
- **Message Brokers**: Apache Kafka, RabbitMQ
- **Real-time Systems**: WebSocket, Socket.io

**Interested in working together?** This project showcases the quality and architecture patterns I bring to client projects. Feel free to reach out for:
- Custom blockchain solutions
- Microservices architecture design
- Backend API development
- Smart contract development
- System integration and optimization

## 🎓 Learning Resources

This project demonstrates:
- Microservices architecture patterns
- Blockchain and smart contract development
- Event-driven architecture
- Message queue patterns
- Retry and error handling strategies
- Real-time communication
- API Gateway implementation
- Database design and optimization
- Docker containerization
- Production-ready code structure

## 📞 Support

For questions or issues, please open an issue in the repository.

---

## 📌 Important Notes

**This is a sample/portfolio project** created to demonstrate technical skills and capabilities. 

- ✅ **Suitable for**: Portfolio showcase, learning reference, architecture demonstration
- ⚠️ **Not intended for**: Direct production deployment without customization
- 🔧 **For production use**: Requires security audits, proper credential management, and customization for specific business requirements

**For clients**: This project demonstrates the quality, architecture patterns, and technical depth I bring to client engagements. All code follows industry best practices and can be adapted to meet your specific business needs.

---

**Built with ❤️ to showcase modern backend and blockchain development expertise**
