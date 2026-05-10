# AI Context

## Project Architecture
- Monorepo with `apps/web` (Next.js), `apps/backend` (Node/TypeScript + Prisma), `apps/typing-engine` (Python), and `apps/desktop-runtime` launcher.

## APIs Used
- Backend HTTP + WebSocket APIs for health, pairing, session, typing, and logs.
- Prisma ORM for local SQLite persistence in backend.

## Dependencies
- Node.js, pnpm workspaces, TypeScript, Prisma, Python runtime + engine requirements.

## Major Decisions
- Base version is represented by `current_version.txt=BASE`.
- All post-base updates must be tracked via immutable append-only `updates.log`.
- Version snapshots are stored at `versions/v<number>/` with optional zip backups.

## Pending Issues
- Keep all future updates using pre-change logging flow.

## Future Improvements
- Automate pre-change logging via assistant wrapper command for each prompt.
- Add CI checks to fail if `current_version.txt` or `updates.log` continuity breaks.
