# Smart Auto Typer - Getting Started (30 Minutes to Typing)

**Quickest path to running Smart Auto Typer end-to-end.**

## Prerequisites Check (2 minutes)

```bash
# Check Node.js (should be 20+)
node --version

# Check Python (should be 3.8+)
python --version

# Check pnpm (or use npm, but pnpm recommended)
pnpm --version
```

If anything is missing, install from:
- Node.js: https://nodejs.org/
- Python: https://www.python.org/
- pnpm: `npm install -g pnpm`

## Install & Setup (10 minutes)

### Option A: Automated Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
bash setup.sh
```

This will:
- Install all dependencies
- Set up the database
- Install Python packages
- Configure everything

### Option B: Manual Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up database
pnpm db:push

# 3. Install Python dependencies
cd apps/typing-engine
pip install -r requirements.txt
cd ../..
```

## Start Services (5 minutes)

### Option A: All Services at Once

**Windows:**
```bash
start.bat
```

**macOS/Linux:**
```bash
bash start.sh
```

### Option B: Start Individually

Open 3 separate terminals:

**Terminal 1 - Backend:**
```bash
pnpm --filter backend dev
# Should show: "Backend running on port 4000"
```

**Terminal 2 - Engine:**
```bash
python apps/typing-engine/engine.py
# Should show: "Server listening on 0.0.0.0:5000"
```

**Terminal 3 - Frontend:**
```bash
pnpm --filter web dev
# Should show: "Local: http://localhost:3000"
```

## First Use (15 minutes)

### Step 1: Open Frontend
Visit: **http://localhost:3000**

You should see:
- Hero section with "Smart Auto Typer"
- "Get Started" button
- Connection indicator (might show red initially, will turn green)

### Step 2: Generate QR Code
1. Click "Get Started" or go to `/devices`
2. Click "Generate QR Code"
3. Wait for QR code to appear
4. Note the pairing code (e.g., ABC12345)

### Step 3: Pair Device

**On same computer:**
1. Open new browser tab: http://localhost:3000/devices
2. Paste the pairing code into the input field
3. Click "Connect"

**On real phone (same network):**
1. Get backend IP (see terminal output)
2. Visit: `http://[your-ip]:3000`
3. Go to `/devices`
4. Enter pairing code
5. Click "Connect"

### Step 4: Test Typing

1. Make sure frontend tab shows "Connected" (green indicator)
2. Go to `/controller` page
3. Type: "Hello World!"
4. Click "Send Text"
5. **It types on your screen!** 🎉

### Step 5: Monitor Dashboard

1. Go to `/dashboard`
2. See:
   - Backend status (should be green)
   - Queue status
   - Device list
   - System logs
   - Uptime

## Verification

Quick sanity checks:

```bash
# 1. Backend health
curl http://localhost:4000/health

# Should return JSON with all "true" values

# 2. Frontend loads
# Open http://localhost:3000 - should work

# 3. Dashboard
# Open http://localhost:3000/dashboard - should show data
```

## Common First-Time Issues

### "Cannot connect to backend"
- Is backend running? Check terminal for "port 4000"
- Firewall? Allow port 4000

### "Typing engine not responding"
- Is Python engine running?
- Check for error in Python terminal
- Ensure port 5000 is free

### "QR code won't generate"
- Backend needs to be running
- Check backend logs for errors

### "Device won't pair"
- Make sure both tabs/devices use same backend URL
- Check pairing code is correct
- Try generating new code

## File You'll Need to Know

| File | For... |
|------|--------|
| `http://localhost:3000` | Frontend |
| `http://localhost:3000/devices` | Pair devices |
| `http://localhost:3000/controller` | Send typing |
| `http://localhost:3000/dashboard` | Monitor |
| `http://localhost:3000/settings` | Configure |
| `http://localhost:4000/health` | Check backend |

## Next Steps

### To Use More Features:
- **Settings**: Adjust typing speed, delays, reconnection behavior
- **Multiple Devices**: Pair multiple devices by repeating Step 2-3
- **Logs**: View all system activity in dashboard
- **Device Management**: Revoke trusted devices

### To Understand Better:
- Read: `README.md` - Overview
- Read: `ARCHITECTURE.md` - How it works
- Read: `VERIFICATION_GUIDE.md` - Deep testing

### To Modify:
- Frontend pages: Edit files in `apps/web/app/`
- Backend logic: Edit files in `apps/backend/src/`
- Python engine: Edit `apps/typing-engine/engine.py`

### To Deploy:
- Read: `README.md` - Deployment section
- Set production environment variables
- Use production database

## Understanding the Flow

```
You Type (Phone)
    ↓
Click Send
    ↓
WebSocket message to Backend
    ↓
Backend adds to database queue
    ↓
Python engine reads queue
    ↓
Engine types on your desktop
    ↓
Text appears!
```

## Common Commands You'll Use

```bash
# Development
pnpm dev                    # All services
pnpm --filter backend dev   # Just backend
pnpm --filter web dev       # Just frontend
python apps/typing-engine/engine.py  # Just engine

# Database
pnpm db:studio             # GUI to view/edit database
pnpm db:push               # Apply schema changes
pnpm db:reset              # Wipe database

# Building
pnpm build                 # Build for production

# View Logs
tail -f apps/backend/src/index.ts  # Not applicable, read terminal
```

## Troubleshooting Checklist

If something doesn't work:

- [ ] All three services running? (Check 3 terminals)
- [ ] No port conflicts? (Ports 3000, 4000, 5000)
- [ ] Frontend shows "Connected"? (Green indicator)
- [ ] Database created? (Check `apps/backend/prisma/dev.db`)
- [ ] Python installed? (`python --version`)
- [ ] Node.js installed? (`node --version`)
- [ ] pnpm installed? (`pnpm --version`)

## Getting Help

1. **See errors in terminal?** - Screenshot and check error message
2. **Check**: `STARTUP_GUIDE.md` - Full setup details
3. **Test**: `VERIFICATION_GUIDE.md` - Systematic testing
4. **Understand**: `ARCHITECTURE.md` - How system works
5. **Reference**: `PROJECT_INDEX.md` - File locations

## System Ready?

Your system is ready when:
- ✅ All three services start without errors
- ✅ Frontend loads at http://localhost:3000
- ✅ Green "Connected" indicator shows
- ✅ QR code generates on /devices
- ✅ Can pair a device
- ✅ Can type and see output
- ✅ Dashboard shows real data

## Success Checklist

- [ ] Services running
- [ ] Frontend loads
- [ ] Device paired
- [ ] Text sends
- [ ] Desktop types
- [ ] Dashboard shows data
- [ ] No errors in logs

When ALL checked: **You're done!** 🎉

---

## One-Command Quick Start

If you want everything in one go:

```bash
# After initial setup (pnpm install, pnpm db:push)
python apps/desktop-runtime/launcher.py
```

Then open http://localhost:3000 in browser.

---

**Expected Time:**
- Setup: 10 minutes
- First run: 5 minutes
- First typing: 2 minutes

**Total: ~15-20 minutes to working application**

Good luck! 🚀
