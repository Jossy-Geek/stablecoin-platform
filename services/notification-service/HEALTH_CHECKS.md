# Health Check Implementation

## Overview

The notification-service implements comprehensive health checks following microservice best practices and Kubernetes-style health probes.

## Health Check Endpoints

### 1. Liveness Probe (`GET /health/live`)

**Purpose:** Determines if the service is alive and running.

**Use Case:** Used by orchestrators (Kubernetes, Docker Swarm, etc.) to decide if the container should be restarted.

**Checks:**
- ✅ Process is running
- ✅ Basic memory (heap) check

**Response Codes:**
- `200 OK` - Service is alive
- `503 Service Unavailable` - Service is not alive

**Example:**
```bash
curl http://localhost:3004/health/live
```

### 2. Readiness Probe (`GET /health/ready`)

**Purpose:** Determines if the service is ready to accept traffic.

**Use Case:** Used by load balancers and orchestrators to route traffic. Only returns healthy when all critical dependencies are available.

**Checks:**
- ✅ MongoDB connectivity
- ✅ RabbitMQ connectivity
- ✅ Email provider status
- ✅ Memory usage (heap & RSS)

**Response Codes:**
- `200 OK` - Service is ready
- `503 Service Unavailable` - Service is not ready

**Example:**
```bash
curl http://localhost:3004/health/ready
```

### 3. Startup Probe (`GET /health/startup`)

**Purpose:** Determines if the service has finished starting up.

**Use Case:** Used during initial startup to allow services more time to initialize before marking them as ready.

**Checks:**
- ✅ MongoDB connectivity
- ✅ RabbitMQ connectivity

**Response Codes:**
- `200 OK` - Service has started
- `503 Service Unavailable` - Service is still starting

**Example:**
```bash
curl http://localhost:3004/health/startup
```

### 4. Full Health Check (`GET /health`)

**Purpose:** Comprehensive health check of all components.

**Use Case:** Used for monitoring, debugging, and detailed status reporting.

**Checks:**
- ✅ MongoDB connectivity
- ✅ RabbitMQ connectivity
- ✅ Email provider status
- ✅ Memory usage (heap & RSS)
- ✅ Disk storage (absolute & percentage)

**Response Codes:**
- `200 OK` - All checks passed
- `503 Service Unavailable` - One or more checks failed

**Example:**
```bash
curl http://localhost:3004/health
```

## Response Format

### Success Response
```json
{
  "status": "ok",
  "info": {
    "mongodb": {
      "status": "up"
    },
    "rabbitmq": {
      "status": "up",
      "message": "RabbitMQ connection is healthy"
    },
    "email_provider": {
      "status": "up",
      "provider": "sendgrid",
      "message": "Email provider (sendgrid) is ready"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    },
    "storage": {
      "status": "up"
    },
    "storage_percent": {
      "status": "up"
    },
    "service": "notification-service",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 12345.67,
    "timestamp": "2024-01-18T10:30:00.000Z"
  },
  "error": {},
  "details": {
    "mongodb": {
      "status": "up"
    },
    "rabbitmq": {
      "status": "up"
    },
    "email_provider": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    },
    "storage": {
      "status": "up"
    },
    "storage_percent": {
      "status": "up"
    }
  }
}
```

### Error Response
```json
{
  "status": "error",
  "info": {
    "service": "notification-service",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 12345.67,
    "timestamp": "2024-01-18T10:30:00.000Z"
  },
  "error": {
    "message": "MongoDB connection failed"
  }
}
```

## Health Check Components

### 1. MongoDB Health Check
- **Indicator:** `mongodb`
- **Check:** Ping MongoDB connection
- **Timeout:** 5 seconds
- **Critical:** Yes (for readiness)

### 2. RabbitMQ Health Check
- **Indicator:** `rabbitmq`
- **Check:** Verify connection and create test channel
- **Timeout:** 3 seconds
- **Critical:** Yes (for readiness)

### 3. Email Provider Health Check
- **Indicator:** `email_provider`
- **Check:** Verify email provider (SendGrid/Mailgun) is configured and ready
- **Timeout:** 5 seconds
- **Critical:** Yes (for readiness)
- **Info:** Includes provider name (sendgrid/mailgun)

### 4. Memory Health Checks
- **Heap Memory:** Maximum 300MB
- **RSS Memory:** Maximum 500MB
- **Critical:** Yes (for readiness)

### 5. Disk Storage Health Checks
- **Absolute:** Maximum 100GB used
- **Percentage:** Maximum 80% used
- **Critical:** No (only in full health check)

## Configuration

Health check thresholds can be configured in:
```
src/modules/health/config/health.config.ts
```

### Current Thresholds
```typescript
{
  memory: {
    heap: 300 * 1024 * 1024,      // 300MB
    rss: 500 * 1024 * 1024,       // 500MB
  },
  disk: {
    absolute: 100 * 1024 * 1024 * 1024,  // 100GB
    percentage: 0.8,                      // 80%
  },
  timeouts: {
    database: 5000,    // 5 seconds
    rabbitmq: 3000,    // 3 seconds
    email: 5000,        // 5 seconds
  }
}
```

## Kubernetes Integration

### Example Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  template:
    spec:
      containers:
      - name: notification-service
        image: notification-service:latest
        ports:
        - containerPort: 3004
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3004
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3004
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /health/startup
            port: 3004
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 30
```

## Best Practices Implemented

✅ **Multiple Probe Types:** Liveness, Readiness, and Startup probes
✅ **Fast Liveness Checks:** Minimal checks for quick response
✅ **Comprehensive Readiness:** All critical dependencies checked
✅ **Graceful Error Handling:** Partial health status on failures
✅ **Service Information:** Version, uptime, environment included
✅ **Timeout Management:** Configurable timeouts for each check
✅ **Detailed Logging:** Errors logged for debugging
✅ **HTTP Status Codes:** Proper status codes (200, 503)
✅ **Structured Responses:** Consistent JSON response format
✅ **Resource Monitoring:** Memory and disk usage tracked

## Monitoring Integration

### Prometheus Metrics (Future Enhancement)
The health endpoints can be integrated with Prometheus for metrics collection:
- Health check success/failure rates
- Response times
- Component availability

### Alerting
Set up alerts based on:
- Readiness probe failures
- Critical component failures (MongoDB, RabbitMQ)
- Resource exhaustion (memory, disk)

## Troubleshooting

### Service Not Ready
1. Check MongoDB connection: `curl http://localhost:3004/health/ready`
2. Verify RabbitMQ is running and accessible
3. Check email provider configuration
4. Review service logs for detailed error messages

### High Memory Usage
1. Check memory thresholds in `health.config.ts`
2. Monitor heap and RSS usage
3. Consider increasing thresholds if service legitimately needs more memory

### Connection Timeouts
1. Verify network connectivity
2. Check firewall rules
3. Increase timeout values if needed (in `health.config.ts`)
