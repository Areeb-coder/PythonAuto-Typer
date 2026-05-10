# Smart Auto Typer - Complete Startup Guide

This guide walks you through starting Smart Auto Typer for the first time.

## Prerequisites

### System Requirements

- Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- Minimum 4GB RAM
- 500MB disk space
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Software Requirements

#### Node.js & npm/pnpm

```bash
# Download from https://nodejs.org/ (LTS recommended)
# Or use package manager

# macOS
brew install node

# Ubuntu/Debian
sudo apt-get install nodejs npm

# Windows (or use chocolatey)
choco install nodejs
```

Verify installation:
```bash
node --version    # Should be 20+
npm --version     # Should be 10+
```

#### pnpm (Recommended)

```bash
npm install -g pnpm

# Verify
pnpm --version    # Should be 9+
```

#### Python 3.8+

```bash
# Download from https://www.python.org/downloads/
# Or use package manager

# macOS
brew install python3

# Ubuntu/Debian
sudo apt-get install python3 python3-pip

# Windows
# Download from python.org or use chocolatey
choco install python
```

Verify installation:
```bash
python --version  # Should be 3.8+
```

## Step-by-Step Startup

### Step 1: Clone/Extract Project

```bash
cd your-project-directory
```

### Step 2: Install Dependencies

```bash
# Install all dependencies (frontend, backend, shared)
pnpm install

# This installs:
# - apps/web
# - apps/backend
# - apps/shared
# - apps/typing-engine dependencies
```

**If using npm:**
```bash
npm install
# Not recommended as npm doesn't handle monorepo workspaces well
```

### Step 3: Set Up Database

```bash
# Push Prisma schema to SQLite
pnpm db:push

# Output should show:
# ✔ Your database has been successfully created against "file:./prisma/dev.db"
# ✔ Generated Prisma Client
```

### Step 4: Verify Environment Files

**Backend .env:**
```bash
# Create or verify apps/backend/.env
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="development"
PORT=4000
LOG_LEVEL="debug"
FRONTEND_URL="http://localhost:3000"
TYPING_ENGINE_PORT=5000
PYTHON_ENGINE_HOST="localhost"
```

**Frontend .env.local:**
```bash
# Create apps/web/.env.local
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"
```

### Step 5: Start Services

#### Option A: Use Desktop Launcher (Recommended)

Windows:
```bash
python apps/desktop-runtime/launcher.py
```

macOS/Linux:
```bash
python3 apps/desktop-runtime/launcher.py
```

This opens separate console windows for each service and displays URLs.

#### Option B: Start Manually in Separate Terminals

**Terminal 1 - Backend (required)**
```bash
cd apps/backend
pnpm dev

# Expected output:
# [INFO] Backend running on port 4000
# [INFO] Socket.IO handlers registered
# [INFO] Health check available at /health
```

**Terminal 2 - Typing Engine (required)**
```bash
cd apps/typing-engine
python engine.py

# Expected output:
# INFO:__main__:Typing Engine initialized on 0.0.0.0:5000
# INFO:__main__:Typing Engine started
# INFO:__main__:Server listening on 0.0.0.0:5000
```

**Terminal 3 - Frontend (required)**
```bash
cd apps/web
pnpm dev

# Expected output:
# > next dev -p 3000
# Ready in 2.5s
# Local: http://localhost:3000
```

### Step 6: Verify Services Are Running

Open these URLs in your browser:

1. **Frontend**: http://localhost:3000
   - Should show landing page with "Smart Auto Typer" hero
   - Status indicator should show "Connected"

2. **Backend Health**: http://localhost:4000/health
   - Should show JSON health status:
   ```json
   {
     "backend": true,
     "database": true,
     "socket": true,
     "typingEngine": true,
     "uptime": 123,
     "timestamp": "2024-05-10T...",
     "latency": 0
   }
   ```

3. **Dashboard**: http://localhost:3000/dashboard
   - Should show all green status indicators
   - Connected devices section (empty initially)
   - Recent logs section

## First Time Usage

### 1. Generate QR Code

1. Go to http://localhost:3000/devices
2. Click "Generate QR Code"
3. A QR code appears with a pairing code (e.g., "ABC12345")

### 2. Pair Device

On your phone (desktop browser for testing):
1. Open http://localhost:3000 on your phone
2. Go to /devices
3. Either:
   - Scan the QR code from step 1
   - Or manually enter the pairing code
4. Click "Connect"

### 3. Start Typing

1. Go to http://localhost:3000/controller
2. Type text in the textarea
3. Click "Send Text"
4. On Windows/Mac, your desktop will auto-type the text!

### 4. Monitor Dashboard

1. Go to http://localhost:3000/dashboard
2. See real-time:
   - Queue status
   - Connected devices
   - System logs
   - Backend health

## Verification Checklist

After starting, verify everything works:

- [ ] Frontend loads at http://localhost:3000
- [ ] Backend responds at http://localhost:4000/health
- [ ] Typing engine shows "Server listening on 0.0.0.0:5000"
- [ ] Database created at apps/backend/prisma/dev.db
- [ ] Can generate QR code on /devices page
- [ ] Can pair device (create session)
- [ ] Can type and see output on connected desktop
- [ ] Dashboard shows real data (not mock data)
- [ ] Connection indicator shows "Connected"
- [ ] Logs appear in /api/logs
- [ ] Settings page loads and persists

## Common Issues & Solutions

### Issue: Port already in use

**Error**: `EADDRINUSE: address already in use :::4000`

**Solution**:
```bash
# Kill process on port 4000
lsof -ti :4000 | xargs kill -9  # macOS/Linux

# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**Or change port** in `apps/backend/.env`:
```env
PORT=4001  # Changed from 4000
```

### Issue: Database connection error

**Error**: `PrismaClientInitializationError: Can't reach database server`

**Solution**:
```bash
# Reset database
pnpm db:reset

# Or manually
rm apps/backend/prisma/dev.db
pnpm db:push
```

### Issue: Python dependencies missing

**Error**: `ModuleNotFoundError: No module named 'pyautogui'`

**Solution**:
```bash
cd apps/typing-engine
pip install -r requirements.txt
```

### Issue: Frontend won't connect

**Error**: `Connection failed` on dashboard

**Check**:
1. Backend running? `curl http://localhost:4000/health`
2. Correct backend URL? Check `apps/web/.env.local`
3. CORS enabled? Check backend logs

### Issue: QR code generation fails

**Check**:
1. Backend running
2. Database connection OK
3. Check `pnpm --filter backend dev` logs for errors

### Issue: Typing doesn't work on desktop

**Check**:
1. Typing engine running? See port 5000 logs
2. Window focused on desktop? PyAutoGUI requires focus
3. Correct OS? (Windows/macOS/Linux have different key codes)

## Development Tips

### View Database

```bash
# Open Prisma Studio (visual database browser)
pnpm db:studio

# Runs on http://localhost:5555
# Can inspect tables and create test data
```

### View Backend Logs

```bash
# In backend directory
cat nohup.out

# Or watch in real-time
tail -f nohup.out
```

### Debug Socket.IO

Open browser DevTools and run:
```javascript
// Check socket connection
io.engine.transport.socket.connected

// See queued events
io.sockets
```

### Mock Device Pairing

Test without a real device:
```bash
# In browser console on /devices page
localStorage.setItem('session', JSON.stringify({
  device: { id: 'test', name: 'Test Device' },
  sessionToken: 'fake-token'
}))
window.location.href = '/controller'
```

## Production Preparation

### Before deploying:

1. **Environment variables set correctly**
   ```bash
   NODE_ENV="production"
   DATABASE_URL="file:./prisma/prod.db"  # Or cloud DB
   ```

2. **CORS configured**
   ```typescript
   // Backend: apps/backend/src/index.ts
   FRONTEND_URL = "https://your-domain.com"
   ```

3. **Build tested**
   ```bash
   pnpm build
   ```

4. **Database migrated**
   ```bash
   pnpm db:push --skip-generate
   ```

5. **Secrets secured**
   - Session tokens encrypted
   - No credentials in git
   - Environment variables on server

## Next Steps

1. **Customize**: Modify components in `apps/web/app`
2. **Add features**: Create new API routes in backend
3. **Deploy**: See deployment section in main README
4. **Monitor**: Check logs and metrics regularly

## Getting Help

If services won't start:

1. **Check logs** - Read terminal output carefully
2. **Verify prerequisites** - Node, Python, pnpm installed?
3. **Port conflicts** - Change ports if in use
4. **Clean install** - `rm -rf node_modules && pnpm install`

## Quick Commands Reference

```bash
# Start everything
python apps/desktop-runtime/launcher.py

# Start individual services
pnpm --filter backend dev      # Backend only
pnpm --filter web dev          # Frontend only
python apps/typing-engine/engine.py  # Engine only

# Build for production
pnpm build

# View database
pnpm db:studio

# Reset database
pnpm db:reset

# Check health
curl http://localhost:4000/health

# Watch logs
pnpm --filter backend dev  # Shows all backend logs
```

---

**You're all set!** 🚀 Smart Auto Typer is now running on your machine.

Visit http://localhost:3000 to get started.
