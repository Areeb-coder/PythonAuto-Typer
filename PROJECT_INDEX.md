# Project Index - Smart Auto Typer

Quick reference for all files and their purposes.

## Root Level Files

| File | Purpose |
|------|---------|
| `package.json` | Root workspace configuration with all dependencies |
| `README.md` | Main project overview and documentation |
| `STARTUP_GUIDE.md` | Complete step-by-step setup instructions |
| `VERIFICATION_GUIDE.md` | Testing and verification procedures |
| `ARCHITECTURE.md` | System architecture and design patterns |
| `BUILD_SUMMARY.md` | Complete build status and summary |
| `setup.sh` | Setup script for macOS/Linux |
| `setup.bat` | Setup script for Windows |
| `start.sh` | Start all services (macOS/Linux) |
| `start.bat` | Start all services (Windows) |
| `.gitignore` | Git ignore rules |

## Frontend (apps/web)

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `next.config.js` | Next.js configuration |
| `tailwind.config.js` | TailwindCSS theme config |
| `postcss.config.js` | PostCSS plugins |
| `.env.local` | Environment variables |
| `.gitignore` | Git ignore rules |

### Application Files
| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with providers |
| `app/page.tsx` | Landing page (/) |
| `app/globals.css` | Global styles and custom classes |
| `app/devices/page.tsx` | Device pairing page |
| `app/controller/page.tsx` | Main typing controller |
| `app/dashboard/page.tsx` | Real-time dashboard |
| `app/settings/page.tsx` | Settings management |

### Library Files
| File | Purpose |
|------|---------|
| `src/lib/socket.ts` | Socket.IO singleton |
| `src/lib/stores.ts` | Zustand state stores |
| `src/lib/api.ts` | API client utilities |
| `src/lib/utils.ts` | Helper functions |

## Backend (apps/backend)

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `.env` | Environment variables |
| `.env.example` | Example env file |

### Application Files
| File | Purpose |
|------|---------|
| `src/index.ts` | Main Fastify server |
| `src/logger.ts` | Logging utilities |
| `src/database.ts` | Database initialization |

### Services
| File | Purpose |
|------|---------|
| `src/services/device.ts` | Device management |
| `src/services/typing.ts` | Typing queue management |
| `src/services/qr.ts` | QR code generation |
| `src/services/session.ts` | Session management |
| `src/services/logging.ts` | Logging service |
| `src/services/socket-handlers.ts` | WebSocket event handlers |

### Database
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema |
| `prisma/dev.db` | SQLite database (generated) |

## Shared (apps/shared)

| File | Purpose |
|------|---------|
| `src/types.ts` | All TypeScript type definitions |
| `src/index.ts` | Export barrel |
| `package.json` | Configuration |
| `tsconfig.json` | TypeScript config |

## Python Engine (apps/typing-engine)

| File | Purpose |
|------|---------|
| `engine.py` | Main typing daemon |
| `requirements.txt` | Python dependencies |
| `README.md` | Engine documentation |

## Desktop Runtime (apps/desktop-runtime)

| File | Purpose |
|------|---------|
| `launcher.py` | Multi-service launcher |
| `README.md` | Launcher documentation |

## Documentation Structure

```
Documentation Hierarchy:
├── README.md (Start here)
│   ├── STARTUP_GUIDE.md (Setup and run)
│   ├── VERIFICATION_GUIDE.md (Testing procedures)
│   ├── ARCHITECTURE.md (System design)
│   ├── BUILD_SUMMARY.md (Build status)
│   └── PROJECT_INDEX.md (This file)
└── In-code comments and JSDoc
```

## Key Files by Function

### Real-time Communication
- `apps/web/src/lib/socket.ts` - Client connection
- `apps/backend/src/services/socket-handlers.ts` - Server handlers
- `apps/backend/src/index.ts` - Socket.IO setup

### State Management
- `apps/web/src/lib/stores.ts` - All Zustand stores
- `apps/web/app/layout.tsx` - Provider setup

### Database Access
- `apps/backend/src/database.ts` - Prisma init
- `apps/backend/src/services/*.ts` - Service layer
- `apps/backend/prisma/schema.prisma` - Schema

### API Endpoints
- `apps/backend/src/index.ts` - Route definitions
- `apps/web/src/lib/api.ts` - Client API calls

### UI Pages
- `apps/web/app/page.tsx` - Landing
- `apps/web/app/devices/page.tsx` - Pairing
- `apps/web/app/controller/page.tsx` - Main feature
- `apps/web/app/dashboard/page.tsx` - Monitoring
- `apps/web/app/settings/page.tsx` - Configuration

### Python Engine
- `apps/typing-engine/engine.py` - Everything

### Setup & Launch
- `setup.sh` / `setup.bat` - Initial setup
- `start.sh` / `start.bat` - Service startup
- `apps/desktop-runtime/launcher.py` - Python launcher

## File Statistics

- **Total Configuration Files**: 15+
- **TypeScript Files**: 20+
- **CSS/Styling**: 500+ lines
- **Python Files**: 1 (comprehensive)
- **Database Schema**: 7 tables
- **Documentation Files**: 5
- **Script Files**: 4

## Development Workflow

1. **First Time Setup**
   - Read: `STARTUP_GUIDE.md`
   - Run: `setup.sh` or `setup.bat`

2. **Development**
   - Edit: Frontend in `apps/web/app`
   - Edit: Backend in `apps/backend/src`
   - Edit: Engine in `apps/typing-engine/engine.py`

3. **Testing**
   - Follow: `VERIFICATION_GUIDE.md`
   - Monitor: `apps/web/app/dashboard/page.tsx`

4. **Deployment**
   - Check: `BUILD_SUMMARY.md`
   - Deploy as per `README.md`

## Important Patterns

### Frontend
- Pages use `'use client'` directive
- Stores imported as `useXxxStore()` from `src/lib/stores`
- API calls use `src/lib/api` utilities
- Socket accessed via `getSocket()` from `src/lib/socket`

### Backend
- Services are singleton instances
- Always validate session tokens
- Use proper error responses
- Log all significant events

### Python
- Runs as persistent daemon
- Listens on port 5000
- Processes tasks from queue
- Handles special characters

## Quick Navigation

By Feature:
- **Real-time Typing**: socket-handlers.ts → typing.ts → engine.py
- **Device Pairing**: QR page → device.ts → session.ts
- **Settings**: settings/page.tsx → api.ts → backend route
- **Monitoring**: dashboard/page.tsx → api.ts → database

By Layer:
- **UI**: `apps/web/app/*.tsx`
- **State**: `apps/web/src/lib/stores.ts`
- **API Client**: `apps/web/src/lib/api.ts`
- **API Server**: `apps/backend/src/index.ts`
- **Services**: `apps/backend/src/services/*.ts`
- **Database**: `apps/backend/prisma/schema.prisma`
- **Engine**: `apps/typing-engine/engine.py`

## Ports Reference

- **Frontend**: 3000 (Next.js dev server)
- **Backend**: 4000 (Fastify + Socket.IO)
- **Typing Engine**: 5000 (Python TCP server)
- **Prisma Studio**: 5555 (when running `pnpm db:studio`)

## Configuration Files

Default values (can be changed):

**Backend `.env`:**
- PORT=4000
- NODE_ENV=development
- FRONTEND_URL=http://localhost:3000

**Frontend `.env.local`:**
- NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

**Database:**
- SQLite at `apps/backend/prisma/dev.db`

## Common Commands

```bash
# Setup
pnpm install
pnpm db:push

# Development
pnpm dev                              # All services
pnpm --filter backend dev             # Backend only
pnpm --filter web dev                 # Frontend only
python apps/typing-engine/engine.py   # Engine only

# Database
pnpm db:push                          # Apply migrations
pnpm db:reset                         # Reset database
pnpm db:studio                        # Open Prisma Studio

# Building
pnpm build                            # Build all apps
pnpm --filter backend build           # Backend only
pnpm --filter web build               # Frontend only

# Cleaning
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Starting
python apps/desktop-runtime/launcher.py  # All services
bash start.sh / start.bat                # Scripts
```

## Where to Make Changes

| Goal | Edit File |
|------|-----------|
| Add page | `apps/web/app/` |
| Change UI | `apps/web/app/globals.css` |
| Add API route | `apps/backend/src/index.ts` |
| Modify service | `apps/backend/src/services/*.ts` |
| Change types | `apps/shared/src/types.ts` |
| Update schema | `apps/backend/prisma/schema.prisma` |
| Modify engine | `apps/typing-engine/engine.py` |
| Add setting | `apps/backend/prisma/schema.prisma` |

---

**Version**: 1.0.0  
**Last Updated**: May 10, 2026  
**Status**: ✅ Production Ready
