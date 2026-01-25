# Docker Configuration - Simplified Structure

This directory contains simplified Docker Compose files for the stablecoin platform.

## 📁 File Structure

```
docker/
├── docker-compose.infrastructure.yml  # Infrastructure services (databases, brokers, cache)
├── docker-compose.services.yml        # Application services (backend + frontends)
├── .env.example                       # Environment variables template
└── README.md                         # This file
```

## 🚀 Quick Start

### Start All Services

**Option 1: Using both files together**
```bash
# From project root
docker-compose -f docker/docker-compose.infrastructure.yml -f docker/docker-compose.services.yml up -d
```

**Option 2: Using helper script (Linux/Mac)**
```bash
cd docker
chmod +x start-all.sh
./start-all.sh
```

**Option 3: Using helper script (Windows PowerShell)**
```powershell
cd docker
.\start-all.ps1
```

### Start Infrastructure Only

```bash
# Start databases, Redis, RabbitMQ, Kafka
docker-compose -f docker/docker-compose.infrastructure.yml up -d
```

### Start Application Services Only

```bash
# Start backend services and frontends (requires infrastructure to be running)
docker-compose -f docker/docker-compose.services.yml up -d
```

## 📋 Service Groups

### Infrastructure Services (`docker-compose.infrastructure.yml`)

- **postgres-user** - PostgreSQL for user service
- **postgres-transaction** - PostgreSQL for transaction service
- **mongodb** - MongoDB for notification service
- **redis** - Redis cache
- **rabbitmq** - RabbitMQ message broker
- **kafka** - Kafka message broker

### Application Services (`docker-compose.services.yml`)

**Backend Services:**
- **user-service** - User management and authentication
- **transaction-service** - Transaction processing
- **notification-service** - Email notifications
- **transaction-socket-service** - WebSocket service

**Frontend Services:**
- **user-frontend** - User-facing web application
- **admin-frontend** - Admin dashboard

## 🔧 Configuration

### Environment Variables

1. **Create `docker/.env`**:
   ```bash
   cp docker/.env.example docker/.env
   ```

2. **Edit `docker/.env`** with your configuration

3. **Service-specific `.env` files**:
   - `services/user-service/.env`
   - `services/transaction-fireblocks-service/.env`
   - `services/notification-service/.env`
   - `services/transaction-socket-service/.env`

### Using External Databases (IP Addresses)

To use databases running on external servers:

1. **Set IP addresses in `docker/.env`**:
   ```env
   DATABASE_HOST_IP=10.153.39.166
   REDIS_HOST_IP=10.153.39.166
   KAFKA_BROKER_IP=10.153.39.166:9092
   RABBITMQ_URL_IP=amqp://guest:guest@10.153.39.166:5672
   MONGODB_URI_IP=mongodb://10.153.39.166:27017/notification_db
   ```

2. **Start only services** (skip infrastructure containers):
   ```bash
   docker-compose -f docker/docker-compose.services.yml up -d
   ```

## 📊 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| postgres-user | 5432 | User database |
| postgres-transaction | 5433 | Transaction database |
| mongodb | 27017 | Notification database |
| redis | 6379 | Cache |
| rabbitmq | 5672 | AMQP |
| rabbitmq | 15672 | Management UI |
| kafka | 9092 | Broker |
| user-service | 3001 | User API |
| transaction-service | 3003 | Transaction API |
| notification-service | 3004 | Notification API |
| socket-service | 3005 | WebSocket |
| user-frontend | 3006 | User UI |
| admin-frontend | 3007 | Admin UI |

## 🛠️ Common Commands

### Start Services

```bash
# All services
docker-compose up -d

# Infrastructure only
docker-compose -f docker/docker-compose.infrastructure.yml up -d

# Services only
docker-compose -f docker/docker-compose.services.yml up -d
```

### Stop Services

```bash
# All services
docker-compose down

# Infrastructure only
docker-compose -f docker/docker-compose.infrastructure.yml down

# Services only
docker-compose -f docker/docker-compose.services.yml down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service

# Infrastructure services
docker-compose -f docker/docker-compose.infrastructure.yml logs -f
```

### Rebuild Services

```bash
# Rebuild all
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache user-service
```

## 🔍 Troubleshooting

### Service Can't Connect to Database

1. **Check if infrastructure is running**:
   ```bash
   docker-compose -f docker/docker-compose.infrastructure.yml ps
   ```

2. **Check IP configuration**:
   ```bash
   cat docker/.env | grep DATABASE_HOST_IP
   ```

3. **Check service logs**:
   ```bash
   docker-compose logs user-service | grep -i database
   ```

### Port Conflicts

Modify ports in `docker/.env`:
```env
POSTGRES_USER_PORT=5434
REDIS_PORT=6380
USER_SERVICE_PORT=3002
```

## 📚 Related Documentation

- [DOCKER_DEPLOYMENT.md](../DOCKER_DEPLOYMENT.md) - Full deployment guide
- [DOCKER_QUICK_START.md](../DOCKER_QUICK_START.md) - Quick start guide
