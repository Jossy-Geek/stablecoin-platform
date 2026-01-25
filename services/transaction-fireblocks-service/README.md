# Transaction Fireblocks Service

Complete transaction service with Fireblocks integration for minting and burning stablecoins.

## 🏗️ Architecture

### Modular Structure

```
transaction-fireblocks-service/
├── src/
│   ├── shared/              # Shared modules (used across all modules)
│   │   ├── auth/           # JWT authentication strategy
│   │   ├── database/       # Database connection & entities
│   │   ├── guards/         # JWT authentication guards
│   │   ├── kafka/          # Kafka integration
│   │   ├── redis/          # Redis caching
│   │   ├── fireblocks/     # Fireblocks SDK integration
│   │   └── ethersjs/       # Ethers.js contract interaction
│   └── modules/            # Main business logic modules
│       ├── transaction/    # Transaction operations
│       └── fireblocks-webhook/  # Fireblocks callback handler
```

## 🔑 Key Features

- ✅ Kafka sync with user service
- ✅ Manual balance addition (admin)
- ✅ Transaction operations (deposit, withdraw, mint, burn)
- ✅ Fireblocks integration for mint/burn
- ✅ Ethers.js contract interaction
- ✅ Fireblocks webhook callback handler
- ✅ Retry mechanism with DLQ
- ✅ Balance tracking

## 📁 Folder Structure

### Shared Modules (`src/shared/`)
All shared functionality that can be used across multiple modules:

- **auth/** - JWT strategy and authentication module
- **database/** - TypeORM entities and database configuration
- **guards/** - JWT authentication guards
- **kafka/** - Kafka client and service for event streaming
- **redis/** - Redis client and service for caching
- **fireblocks/** - Fireblocks SDK wrapper service
- **ethersjs/** - Ethers.js contract interaction service

### Main Modules (`src/modules/`)
Business logic modules:

- **transaction/** - Transaction operations (deposit, withdraw, mint, burn)
- **fireblocks-webhook/** - Fireblocks webhook callback handler

## 🔄 Fireblocks Integration

### Mint Flow
1. User requests mint
2. Create Fireblocks transaction from mint vault to user vault
3. Fireblocks webhook confirms completion
4. Transfer tokens to user vault
5. Update balance

### Burn Flow
1. User requests burn
2. Create contract call to burn tokens
3. Fireblocks webhook confirms completion
4. Update balance

## 📡 Webhook Endpoint

`POST /webhooks/fireblocks/events`

Handles Fireblocks webhook callbacks with signature verification.

## 🔧 Environment Variables

See `env.example` for all configuration options.

## 🚀 Usage

```bash
# Install dependencies
npm install

# Start development
npm run start:dev

# Build
npm run build

# Start production
npm run start:prod
```

## 📝 Import Examples

### Using Shared Modules

```typescript
// In any module file
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { FireblocksService } from '../../shared/fireblocks/fireblocks.service';
import { DatabaseModule } from '../../shared/database/database.module';
```

### Module Structure

```typescript
// modules/transaction/transaction.module.ts
import { DatabaseModule } from '../../shared/database/database.module';
import { KafkaModule } from '../../shared/kafka/kafka.module';
import { AuthModule } from '../../shared/auth/auth.module';
```
