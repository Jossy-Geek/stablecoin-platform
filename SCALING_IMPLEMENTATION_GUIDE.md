# Scaling Implementation Guide - Step by Step

## 🎯 Target: 1,000,000 Requests/Second per Service

## Quick Start: Immediate Improvements (Day 1)

### 1. Update Database Connection Pool (30 minutes)

**File**: `services/user-service/src/shared/database/database.module.ts`

Replace with optimized configuration:

```typescript
extra: {
  max: 100,              // Increase from default
  min: 10,               // Keep minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  acquireTimeoutMillis: 60000,
}
```

**Impact**: Can handle 10x more concurrent database connections

### 2. Add Database Indexes (15 minutes)

```bash
# Run optimization indexes
psql -U postgres -d st_user_db -f database/optimization-indexes.sql
psql -U postgres -d st_transaction_db -f database/optimization-indexes.sql
```

**Impact**: 50-90% faster query performance

### 3. Enable Redis Caching (1 hour)

**Update services to cache frequently accessed data:**

```typescript
// Example: Cache user data
async getUserById(id: string) {
  const cacheKey = `user:${id}`;
  const cached = await this.redisService.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const user = await this.userRepository.findOne({ where: { id } });
  await this.redisService.set(cacheKey, JSON.stringify(user), 300);
  return user;
}
```

**Impact**: 80-95% reduction in database queries

## Week 1: Load Balancer Setup

### Day 1-2: Deploy Nginx Load Balancer

```bash
# 1. Create Nginx configuration
cp nginx/nginx.conf /etc/nginx/nginx.conf

# 2. Test configuration
nginx -t

# 3. Start Nginx
systemctl start nginx

# 4. Update DNS to point to load balancer
# api.stablecoin.com -> Load Balancer IP
```

### Day 3-4: Deploy Multiple Service Instances

**Update docker-compose.yml:**

```yaml
services:
  user-service-1:
    build: ./services/user-service
    ports:
      - "3001:3001"
  
  user-service-2:
    build: ./services/user-service
    ports:
      - "3002:3001"
  
  user-service-3:
    build: ./services/user-service
    ports:
      - "3003:3001"
```

**Update Nginx upstream:**

```nginx
upstream user_service {
    least_conn;
    server user-service-1:3001;
    server user-service-2:3001;
    server user-service-3:3001;
}
```

### Day 5: Health Checks & Monitoring

**Add health check endpoint to all services:**

```typescript
@Get('health')
health() {
  return { status: 'ok', timestamp: new Date() };
}
```

**Test load balancing:**

```bash
# Send 1000 requests and verify distribution
for i in {1..1000}; do
  curl http://api.stablecoin.com/api/users/me
done
```

## Week 2: Database Scaling

### Day 1-2: Setup PgBouncer

```bash
# Deploy PgBouncer
docker run -d \
  --name pgbouncer \
  -p 6432:6432 \
  -e DATABASES_HOST=postgres-primary \
  -e DATABASES_PORT=5432 \
  -e DATABASES_USER=postgres \
  -e DATABASES_PASSWORD=password \
  pgbouncer/pgbouncer:latest
```

**Update application to use PgBouncer:**

```typescript
// Change DATABASE_HOST from postgres-primary to pgbouncer
// Change DATABASE_PORT from 5432 to 6432
```

### Day 3-4: Create Read Replicas

**AWS RDS Example:**

```bash
# Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier user-db-replica-1 \
  --source-db-instance-identifier user-db-primary \
  --db-instance-class db.r6g.2xlarge
```

**Update application for read/write splitting:**

```typescript
// Use primary for writes, replicas for reads
const readReplicas = [
  'postgres-replica-1:5432',
  'postgres-replica-2:5432',
];

// Route SELECT queries to replicas
// Route INSERT/UPDATE/DELETE to primary
```

### Day 5: Test Database Performance

```bash
# Run database benchmarks
pgbench -h postgres-primary -U postgres -c 100 -j 4 -T 60 st_user_db
```

## Week 3: Redis Cluster

### Day 1-2: Setup Redis Cluster

```bash
# Create Redis cluster with 6 nodes
redis-cli --cluster create \
  redis-1:6379 redis-2:6379 redis-3:6379 \
  redis-4:6379 redis-5:6379 redis-6:6379 \
  --cluster-replicas 1
```

### Day 3: Update Application

**Update Redis client to use cluster:**

```typescript
import { createCluster } from 'redis';

const redisCluster = createCluster({
  rootNodes: [
    { host: 'redis-1', port: 6379 },
    { host: 'redis-2', port: 6379 },
    { host: 'redis-3', port: 6379 },
  ],
});
```

### Day 4-5: Cache Strategy Implementation

**Implement multi-level caching:**

1. **L1 (In-Memory)**: Hot data, 1-5 second TTL
2. **L2 (Redis)**: Warm data, 5-60 second TTL
3. **L3 (Database)**: Cold data, no cache

## Week 4: Kubernetes Deployment

### Day 1-2: Setup Kubernetes Cluster

```bash
# Create EKS cluster (AWS)
eksctl create cluster \
  --name stablecoin-cluster \
  --region us-east-1 \
  --node-type t3.large \
  --nodes 10 \
  --nodes-min 5 \
  --nodes-max 20
```

### Day 3: Deploy Services

```bash
# Create namespace
kubectl create namespace stablecoin

# Deploy user service
kubectl apply -f k8s/user-service-deployment.yaml

# Deploy transaction service
kubectl apply -f k8s/transaction-service-deployment.yaml
```

### Day 4: Configure Auto-Scaling

```bash
# Apply HPA
kubectl apply -f k8s/user-service-hpa.yaml

# Monitor scaling
kubectl get hpa -n stablecoin -w
```

### Day 5: Load Testing

```bash
# Run k6 load test
k6 run load-test.js
```

## 📊 Performance Monitoring

### Key Metrics Dashboard

**Grafana Dashboard Queries:**

```promql
# Request Rate
sum(rate(http_requests_total[5m])) by (service)

# Response Time (P95)
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))

# Error Rate
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)

# Database Connection Pool Usage
sum(db_connections_active) / sum(db_connections_max) * 100

# Redis Hit Rate
sum(rate(redis_commands_total{command="get",result="hit"}[5m])) / sum(rate(redis_commands_total{command="get"}[5m])) * 100
```

## 🔧 Configuration Files Summary

### Created Files:

1. **HIGH_PERFORMANCE_ARCHITECTURE.md** - Complete architecture design
2. **nginx/nginx.conf** - Load balancer configuration
3. **k8s/user-service-deployment.yaml** - Kubernetes deployment
4. **k8s/transaction-service-deployment.yaml** - Kubernetes deployment
5. **database/optimization-indexes.sql** - Database indexes
6. **IMPLEMENTATION_ROADMAP.md** - Step-by-step implementation
7. **SCALING_IMPLEMENTATION_GUIDE.md** - This file

### Next Steps:

1. Review architecture document
2. Prioritize implementation phases
3. Setup development environment
4. Begin Phase 1 implementation
5. Run initial load tests
6. Iterate and optimize

---

**Estimated Timeline**: 12 weeks for full implementation
**Team Size**: 2-3 engineers
**Budget**: $25,000-30,000/month for infrastructure
