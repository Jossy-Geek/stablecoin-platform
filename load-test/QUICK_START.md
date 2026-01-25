# Quick Start - Load Testing

## Prerequisites

**k6 must be installed** - This is NOT a Node.js package!

### Install k6 on Windows

```powershell
# Using Chocolatey (recommended)
choco install k6

# OR using Winget
winget install k6

# OR using Scoop
scoop install k6
```

See [INSTALL_K6.md](./INSTALL_K6.md) for detailed installation instructions.

## Running the Test

### ⚠️ Important: Use `k6` command, NOT `node`

```powershell
# ❌ WRONG - Don't use node
node load-test-1000rps.js

# ✅ CORRECT - Use k6 command
k6 run load-test-1000rps.js
```

### Basic Test

```powershell
# Test user service at localhost:3001
k6 run load-test-1000rps.js
```

### Test with Custom URL

```powershell
# PowerShell
$env:BASE_URL="http://localhost:3001"
k6 run load-test-1000rps.js

# Or in one line
$env:BASE_URL="http://localhost:3001"; k6 run load-test-1000rps.js
```

### Test Different Services

```powershell
# User Service (default)
$env:BASE_URL="http://localhost:3001"; k6 run load-test-1000rps.js

# Transaction Service
$env:BASE_URL="http://localhost:3003"; k6 run load-test-1000rps.js

# Socket Service
$env:BASE_URL="http://localhost:3005"; k6 run load-test-1000rps.js
```

## What the Test Does

- **Target**: 1000 health check requests in 1 second
- **Endpoint**: `GET /health` on user service
- **Duration**: Exactly 1 second
- **Checks**: 
  - Status code is 200
  - Response time < 100ms
  - Response has status field

## Expected Output

```
🚀 Starting load test: 1000 health check requests in 1 second
📍 User Service URL: http://localhost:3001
⏱️  Duration: 1 second
🎯 Target: 1000 requests to /health endpoint

     ✓ health check status is 200
     ✓ health check response time < 100ms
     ✓ response has status field

     checks.........................: 100.00% ✓ 1000   ✗ 0
     data_received..................: 150 KB  150 kB/s
     data_sent......................: 120 KB  120 kB/s
     http_req_duration..............: avg=25ms   min=5ms   med=20ms   max=150ms   p(95)=50ms   p(99)=100ms
     http_req_failed................: 0.00%  ✓ 0      ✗ 1000
     http_reqs......................: 1000   1000/s
     iteration_duration.............: avg=25ms   min=5ms   med=20ms   max=150ms
     vus............................: 1000   min=1000   max=1000
```

## Troubleshooting

### Error: "k6 is not recognized"

**Solution**: k6 is not installed or not in PATH
1. Install k6 using one of the methods in [INSTALL_K6.md](./INSTALL_K6.md)
2. Close and reopen your terminal
3. Verify: `k6 version`

### Error: "Cannot find package 'k6'"

**Solution**: You're trying to run it with `node` instead of `k6`
- Use: `k6 run load-test-1000rps.js`
- NOT: `node load-test-1000rps.js`

### Connection Refused

**Solution**: Make sure the user service is running
```powershell
# Check if service is running
docker ps | Select-String user-service

# Or start the service
cd D:\blockgemini\crypton\stablecoin-platform
docker-compose up user-service
```

### No Requests Sent

**Solution**: Check the BASE_URL is correct
```powershell
# Verify the URL
$env:BASE_URL="http://localhost:3001"
echo $env:BASE_URL

# Test manually first
curl http://localhost:3001/health
```
