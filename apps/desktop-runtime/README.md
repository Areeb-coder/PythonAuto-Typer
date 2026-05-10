# Desktop Runtime Launcher

Unified launcher for starting all Smart Auto Typer services:
- Backend (Fastify + Socket.IO)
- Typing Engine (Python daemon)
- Frontend (Next.js dev server)

## Usage

```bash
python launcher.py
```

This will start all services in new console windows and display their connection URLs.

## Services

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **Typing Engine**: localhost:5000 (internal communication)

## Requirements

- Python 3.8+
- pnpm installed globally
- Node.js 20+
