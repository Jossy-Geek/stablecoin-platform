# User Service

User service for authentication and user management with 2FA support.

## 🏗️ Architecture

### Modular Structure

```
user-service/
├── src/
│   ├── shared/              # Shared modules (used across all modules)
│   │   ├── auth/           # JWT authentication strategy & guards
│   │   ├── database/       # Database connection & entities
│   │   ├── kafka/          # Kafka integration
│   │   ├── redis/          # Redis caching
│   │   └── rabbitmq/       # RabbitMQ integration
│   └── modules/            # Main business logic modules
│       ├── auth/           # Authentication operations
│       └── user/           # User management operations
```

## 🔑 Key Features

- ✅ User & Admin authentication
- ✅ 2FA implementation (TOTP)
- ✅ Password reset with 2FA
- ✅ Kafka sync with transaction service
- ✅ RabbitMQ notifications
- ✅ Redis caching
- ✅ JWT authentication
- ✅ Role-based access control

## 📁 Folder Structure

### Shared Modules (`src/shared/`)
All shared functionality that can be used across multiple modules:

- **auth/** - JWT strategy, guards, and auth module
- **database/** - TypeORM entities and database configuration
- **kafka/** - Kafka client and service for event streaming
- **redis/** - Redis client and service for caching
- **rabbitmq/** - RabbitMQ client and service for message queuing

### Main Modules (`src/modules/`)
Business logic modules:

- **auth/** - Authentication operations (login, register, 2FA, password reset)
- **user/** - User management operations

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
import { JwtAuthGuard } from '../../shared/auth/guards/jwt-auth.guard';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../../shared/auth/auth.module';
```

### Module Structure

```typescript
// modules/auth/auth.module.ts
import { KafkaModule } from '../../shared/kafka/kafka.module';
import { RabbitMQModule } from '../../shared/rabbitmq/rabbitmq.module';
import { AuthModule as SharedAuthModule } from '../../shared/auth/auth.module';
```
