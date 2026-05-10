# Smart Auto Typer - Verification & Testing Guide

Complete guide for verifying and testing all systems of Smart Auto Typer.

## System Verification

### 1. Service Health Check

```bash
# Test Frontend
curl http://localhost:3000

# Should return HTML (next.js app)

# Test Backend Health
curl http://localhost:4000/health

# Expected response:
{
  "backend": true,
  "database": true,
  "socket": true,
  "typingEngine": true,
  "uptime": 12345,
  "timestamp": "2024-05-10T10:30:00Z",
  "latency": 5
}

# Test Typing Engine Status
python3 << 'EOF'
import socket
import json

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('localhost', 5000))
sock.send(json.dumps({'type': 'status'}).encode())
response = sock.recv(1024)
print(json.loads(response.decode()))
sock.close()
EOF

# Should show engine running, queue length 0
```

### 2. Database Verification

```bash
# Open Prisma Studio
pnpm db:studio

# Check tables exist:
# - Device
# - Session
# - Settings
# - TypingHistory
# - QueueHistory
# - Log

# Verify default settings created
```

### 3. Socket Connection Test

Visit http://localhost:3000 and open browser DevTools (F12):

```javascript
// Console
console.log('Socket connected:', socket.connected)

// Should show: true

// Check capabilities
socket.emit('health:request', {}, (res) => console.log(res))

// Should receive health status
```

## Feature Testing

### Test 1: QR Code Generation

1. Navigate to http://localhost:3000/devices
2. Click "Generate QR Code"
3. Verify:
   - [ ] QR code displays
   - [ ] Pairing code shown (8 chars)
   - [ ] QR code is scannable
   - [ ] Code expires after 10 minutes

```bash
# Backend logs should show:
# [DEBUG] QR code generated { code: 'ABC12345' }
```

### Test 2: Device Pairing

**Manual flow:**
1. Open http://localhost:3000/devices on desktop
2. Generate QR code
3. Open http://localhost:3000/devices on phone (or second browser)
4. Click pairing code input
5. Enter code (e.g., ABC12345)
6. Verify:
   - [ ] Device appears in paired devices list
   - [ ] Device shows in dashboard
   - [ ] Session token saved in localStorage
   - [ ] Connection shows "Connected"

```bash
# Backend logs should show:
# [INFO] Device paired { deviceId: 'cuid...', name: 'My Phone' }
```

### Test 3: Real-time Text Typing

1. Navigate to http://localhost:3000/controller (phone)
2. Ensure desktop browser/app window is focused
3. Type in textarea: "Hello World!"
4. Click "Send Text"
5. Verify:
   - [ ] Text appears on desktop (auto-typed)
   - [ ] Queue updated in real-time
   - [ ] Status shows "Typing"
   - [ ] Latency displayed

```bash
# Backend logs:
# [DEBUG] Text queued { charCount: 12 }

# Typing engine logs:
# INFO:__main__:Starting to type task ...
# INFO:__main__:Completed task ... in 0.45s
```

### Test 4: Queue Management

1. Send multiple texts quickly:
   - "First text"
   - "Second text"
   - "Third text"

2. Verify:
   - [ ] All appear in queue
   - [ ] Queue count updates
   - [ ] They type in order
   - [ ] Dashboard shows queue length

### Test 5: Stop Typing

1. Send text that takes a while
2. Click "Stop" button
3. Verify:
   - [ ] Typing stops immediately
   - [ ] Queue cleared
   - [ ] Status shows "Stopped"

```bash
# Backend logs:
# [INFO] Typing stopped { deviceId: '...' }
```

### Test 6: Connection Reconnection

1. Start typing
2. Stop backend (Ctrl+C)
3. Verify:
   - [ ] Frontend shows "Reconnecting"
   - [ ] Status indicator turns red
   - [ ] Socket retries connecting

4. Restart backend
5. Verify:
   - [ ] Frontend reconnects automatically
   - [ ] Status turns green
   - [ ] Session restored

### Test 7: Settings Persistence

1. Go to /settings (when created)
2. Change settings:
   - Typing speed: 120
   - Theme: Light
3. Verify:
   - [ ] Settings saved to database
   - [ ] Settings persist after page reload
   - [ ] Settings synced across devices

```bash
# Database check:
SELECT * FROM Settings;
```

### Test 8: Dashboard Real Data

1. Navigate to http://localhost:3000/dashboard
2. Verify shows real data (not mock):
   - [ ] Backend status: GREEN (true)
   - [ ] Database status: GREEN (true)
   - [ ] Socket status: GREEN (true)
   - [ ] Uptime increases over time
   - [ ] Connected devices list populated
   - [ ] Logs update in real-time
   - [ ] Engine status accurate

### Test 9: Logs System

1. Perform various actions (type, pair, connect)
2. Go to dashboard
3. Verify in Recent Logs:
   - [ ] Logs appear immediately
   - [ ] Correct level (info, error, debug)
   - [ ] Correct category (typing, pairing, etc.)
   - [ ] Timestamp accurate
   - [ ] Metadata present for relevant logs

## Load Testing

### Test 1: High-Speed Typing

```bash
# Send 100 characters rapidly
# Expected: All typed correctly, no delays

# Monitor:
# - CPU usage (should be < 30%)
# - Memory (should be stable)
# - Latency (should stay < 100ms)
```

### Test 2: Queue Stress

```bash
# Queue 10 texts simultaneously
# Expected: All process in order, no errors

# Check in dashboard:
# - Queue length decreases smoothly
# - No dropped items
# - Uptime stable
```

### Test 3: Long-Running Session

```bash
# Run for 1 hour:
# - Periodic type actions
# - Monitor connection
# - Check memory leaks

# Expected:
# - Connection stable
# - Memory usage stable
# - No error accumulation
```

## Browser DevTools Testing

### Console Checks

```javascript
// Check Socket status
console.log('Socket connected:', socket.connected)
console.log('Socket ID:', socket.id)

// Check Zustand stores
console.log('Connection state:', useConnectionStore.getState())
console.log('Device info:', useDeviceStore.getState())
console.log('Queue info:', useQueueStore.getState())

// Check environment
console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL)
```

### Network Tab Checks

1. Open DevTools → Network
2. Perform action (send text)
3. Verify:
   - [ ] WebSocket connection open
   - [ ] Messages flowing both directions
   - [ ] No failed requests
   - [ ] No 401/403 errors

### Performance Tab

1. Record performance profile
2. Send text through queue
3. Verify:
   - [ ] No long tasks (> 50ms)
   - [ ] Smooth 60 FPS animations
   - [ ] No memory leaks
   - [ ] React renders optimized

## API Testing

### Health Endpoint

```bash
# Test health check
curl -s http://localhost:4000/health | jq

# Expected: All true, latency present
```

### Devices Endpoint

```bash
# List devices
curl -s http://localhost:4000/api/devices | jq

# Expected: Array of device objects
```

### Settings Endpoint

```bash
# Get settings
curl -s http://localhost:4000/api/settings | jq

# Expected: Settings object with all fields
```

### Logs Endpoint

```bash
# Get logs with filters
curl -s 'http://localhost:4000/api/logs?level=error&limit=10' | jq

# Expected: Array of log objects
```

## Database Integrity Tests

```bash
# Check all tables exist
pnpm db:studio

# Verify constraints
# - Foreign keys valid
# - Timestamps present
# - IDs unique

# Check indices
# SELECT name FROM sqlite_master WHERE type='index';
```

## Error Handling Tests

### Test 1: Invalid Session Token

```javascript
// In console
socket.emit('authenticate', { sessionToken: 'invalid' }, (res) => 
  console.log(res)
)

// Expected: { success: false, error: 'Invalid session token' }
```

### Test 2: Backend Offline

1. Stop backend server
2. Try to perform action
3. Verify:
   - [ ] Graceful error handling
   - [ ] User-friendly error message
   - [ ] Reconnection attempt visible

### Test 3: Database Error

Simulate by corrupting database:
```bash
# Temporarily break database
chmod 000 apps/backend/prisma/dev.db

# Try action
# Should show database error
# Then restore: chmod 644 ...
```

## Performance Benchmarks

### Expected Metrics

| Metric | Expected | Status |
|--------|----------|--------|
| Page Load Time | < 2s | ☐ |
| WebSocket Connect | < 200ms | ☐ |
| Type Latency | < 50ms | ☐ |
| Queue Processing | 100+ chars/sec | ☐ |
| Dashboard Load | < 1s | ☐ |
| Memory Usage | < 200MB | ☐ |
| CPU Usage | < 30% | ☐ |

## Security Testing

### Test 1: Session Token Validation

```bash
# Send invalid token
curl -H "Authorization: Bearer invalid" \
  http://localhost:4000/api/devices

# Should fail with 401 or similar
```

### Test 2: CORS Headers

```bash
# Check CORS on requests
curl -i -H "Origin: http://evil.com" \
  http://localhost:4000/health

# Should see CORS headers
```

### Test 3: Session Expiration

```bash
# Verify session expires after 7 days
# Check in database:
SELECT * FROM Session WHERE expiresAt < datetime('now');
```

## Final Verification Checklist

- [ ] All three services start without errors
- [ ] Database initialized with default settings
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend responds at http://localhost:4000/health
- [ ] Typing engine listens on port 5000
- [ ] QR code generation works
- [ ] Device pairing works
- [ ] Text typing works end-to-end
- [ ] Real-time updates work
- [ ] Dashboard shows real data
- [ ] Reconnection works
- [ ] Logs are created and visible
- [ ] Settings persist
- [ ] Error handling graceful
- [ ] Performance acceptable
- [ ] No memory leaks
- [ ] Security checks pass

## Testing Results Template

```markdown
# Test Results - [Date]

## Services
- [ ] Backend: ✓ Running on port 4000
- [ ] Frontend: ✓ Running on port 3000
- [ ] Engine: ✓ Running on port 5000
- [ ] Database: ✓ Connected

## Features
- [ ] QR Code Generation: ✓ Working
- [ ] Device Pairing: ✓ Working
- [ ] Text Typing: ✓ Working
- [ ] Queue Management: ✓ Working
- [ ] Dashboard: ✓ Real Data
- [ ] Settings: ✓ Persisting
- [ ] Logs: ✓ Recording
- [ ] Reconnection: ✓ Automatic

## Performance
- Page Load: 1.2s ✓
- WebSocket Connect: 150ms ✓
- Type Latency: 35ms ✓
- Memory: 145MB ✓

## Issues Found
None

## Sign-off
Tested by: [Name]
Date: [Date]
Status: ✓ PRODUCTION READY
```

---

**Test thoroughly before deploying to production!**
