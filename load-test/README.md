# Load Testing Guide - 1000 Requests in 1 Second

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
# or download from https://k6.io/docs/getting-started/installation/
```

## Running the Load Test (1000 Requests in 1 Second)

### Basic Test (User Service)

```bash
# Test user service at localhost:3001
k6 run load-test-1000rps.js

# Test with custom URL
BASE_URL=http://localhost:3001 k6 run load-test-1000rps.js

# Test with authentication token
AUTH_TOKEN=your-jwt-token BASE_URL=http://localhost:3001 k6 run load-test-1000rps.js
```

### Test Different Services

```bash
# Test user service
SERVICE=user-service BASE_URL=http://localhost:3001 k6 run load-test-1000rps.js

# Test transaction service
SERVICE=transaction-service BASE_URL=http://localhost:3003 k6 run load-test-1000rps.js

# Test socket service
SERVICE=socket-service BASE_URL=http://localhost:3005 k6 run load-test-1000rps.js
```

### Test Production/Staging

```bash
# Test production API
BASE_URL=https://api.stablecoin.com \
AUTH_TOKEN=your-production-token \
SERVICE=user-service \
k6 run load-test-1000rps.js
```

## Test Configuration

### Target: 1000 Requests in 1 Second

The test is configured to:
- **Executor**: Constant Arrival Rate
- **Rate**: 1000 requests per second
- **Duration**: Exactly 1 second
- **Pre-allocated VUs**: 1000 virtual users
- **Max VUs**: 2000 (if needed)

### Test Execution

```
Duration: 1 second
Target: 1000 requests
Method: Constant arrival rate executor
```

This ensures exactly 1000 requests are sent within 1 second, regardless of response times.

### Performance Thresholds

- ✅ **P95 Response Time**: < 200ms
- ✅ **P99 Response Time**: < 500ms
- ✅ **Error Rate**: < 1%
- ✅ **Total Requests**: ≥ 1000 requests in 1 second

## Test Scenarios

### User Service Tests

1. **Health Check** (10% of requests)
   - Endpoint: `GET /health`
   - Expected: < 50ms response time

2. **Get User Profile** (60% of requests)
   - Endpoint: `GET /api/users/me`
   - Expected: < 100ms response time

3. **List Users** (20% of requests)
   - Endpoint: `GET /api/users?page=X&limit=20`
   - Expected: < 200ms response time

4. **Get User by ID** (10% of requests)
   - Endpoint: `GET /api/users/{id}`
   - Expected: < 150ms response time

### Transaction Service Tests

1. **Health Check** (5% of requests)
2. **Get Transactions** (50% of requests)
3. **Get Transaction by ID** (30% of requests)
4. **Get Balance** (15% of requests)

## Output Files

The test generates:
- **Console output**: Real-time metrics
- **load-test-results.json**: Detailed JSON results
- **load-test-results.html**: HTML report

## Interpreting Results

### Success Criteria

✅ **All thresholds passed:**
- Total requests ≥ 1000 in 1 second
- P95 < 200ms
- P99 < 500ms
- Error rate < 1%

### Warning Signs

⚠️ **Performance degradation:**
- Response times increasing
- Error rate > 0.5%
- Total requests < 1000 in 1 second

### Failure Indicators

❌ **System overload:**
- Error rate > 1%
- Response times > 500ms
- Total requests < 900 in 1 second
- Connection timeouts

## Troubleshooting

### High Error Rate

```bash
# Check service logs
docker logs stablecoin-user-service

# Check database connections
docker exec -it stablecoin-postgres-user psql -U postgres -d st_user_db -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis
docker exec -it stablecoin-redis redis-cli ping
```

### High Response Time

```bash
# Check service CPU/Memory
docker stats stablecoin-user-service

# Check database performance
docker exec -it stablecoin-postgres-user psql -U postgres -d st_user_db -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Low Request Rate

- Check if services are running
- Verify load balancer configuration
- Check network bandwidth
- Monitor system resources

## Advanced Usage

### Custom RPS Target

Edit the test file to change target RPS:

```javascript
stages: [
  { duration: '30s', target: 2000 },  // Change to 2000 RPS
  { duration: '2m', target: 2000 },
  { duration: '30s', target: 0 },
],
```

### Extended Duration

```javascript
stages: [
  { duration: '1m', target: 1000 },
  { duration: '10m', target: 1000 },  // Run for 10 minutes
  { duration: '1m', target: 0 },
],
```

### Distributed Load Testing

Run on multiple machines:

```bash
# Machine 1
k6 run --vus 250 load-test-1000rps.js

# Machine 2
k6 run --vus 250 load-test-1000rps.js

# Machine 3
k6 run --vus 250 load-test-1000rps.js

# Machine 4
k6 run --vus 250 load-test-1000rps.js
```

## Example Output

```
✓ health check status is 200
✓ get user status is 200
✓ get user response time < 100ms
✓ response has user data

checks.........................: 99.5% ✓ 9950    ✗ 50
data_received..................: 2.5 MB  20 kB/s
data_sent......................: 1.2 MB  10 kB/s
http_req_duration..............: avg=85ms   min=12ms   med=78ms   max=450ms   p(95)=180ms   p(99)=320ms
http_req_failed................: 0.50%  ✓ 50      ✗ 9950
http_reqs......................: 10000  83.33/s
iteration_duration.............: avg=1.08s  min=1.01s  med=1.05s  max=2.5s
vus............................: 1000   min=1000   max=1000
```

## Next Steps

1. Run baseline test to establish metrics
2. Implement optimizations (caching, indexes, etc.)
3. Re-run test to measure improvements
4. Scale up gradually (2000, 5000, 10000 RPS)
5. Monitor and optimize based on results
