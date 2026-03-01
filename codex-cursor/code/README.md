# TaskFlow

TaskFlow is a multi-tenant task management SaaS built with:

- Next.js App Router
- TypeScript (strict)
- tRPC
- Prisma
- SQLite (file-based)
- Zod
- Auth.js (credentials auth)

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env
```

3. Apply migrations and seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

4. Start dev server:

```bash
npm run dev
```

## Docker (production-style)

Start from zero with Docker Compose:

1. Create Docker env file:

```bash
cp .env.docker.example .env.docker
```

2. Start stack:

```bash
docker compose up --build
```

This will:

- build a multi-stage production image,
- run Prisma migrations automatically in the `migrate` one-shot service,
- start the Next.js app in the `app` service on `http://localhost:3000`.

To run in background:

```bash
docker compose up --build -d
```

To stop:

```bash
docker compose down
```

## Environment

Required values (see `.env.example`):

- `DATABASE_URL` (SQLite path, e.g. `file:./prisma/dev.db`)
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET` (required in production, recommended in all envs)
- `MAX_BODY_SIZE_BYTES` (request body safety limit)

For Docker Compose, use `.env.docker.example` as the template:

- `DATABASE_URL` should point to mounted volume storage (default: `file:/app/data/taskflow.db`)
- `NEXTAUTH_URL` should match the externally reachable app URL
- `NEXTAUTH_SECRET` must be a strong random secret in production

Environment validation is enforced in `src/lib/env.ts`.

## Architecture

- API routers: `src/server/api/routers`
- Domain services: `src/server/services`
- Repositories: `src/server/repositories`
- Auth config/session/policies: `src/server/auth`
- UI routes: `src/app`
- Feature UI: `src/features`

See `docs/architecture.md` for full details.

## Commands

- `npm run dev` — run app locally
- `npm run lint` — lint with zero warnings
- `npm run typecheck` — strict TypeScript checks
- `npm run test:run` — run unit + integration tests
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:migrate` — run Prisma migrations
- `npm run prisma:deploy` — apply existing migrations (non-interactive)
- `npm run prisma:seed` — seed local DB

## Security and reliability notes

- Auth and API inputs are Zod-validated.
- Passwords use `bcryptjs` hashing.
- Multi-tenant boundaries are enforced with org-scoped queries and policy guards.
- Request size limits are enforced on auth/trpc route handlers.
- Structured logs include correlation IDs (`x-request-id`) for traceability.

## Local runbook

### Clean local DB reset

```bash
rm -f prisma/dev.db prisma/dev.db-journal
npm run prisma:migrate
npm run prisma:seed
```

### Verify app health before merge/release

```bash
npm run lint
npm run typecheck
npm run test:run
```

## Release checklist

- [ ] Confirm `.env` production values and secure `NEXTAUTH_SECRET`
- [ ] Apply migrations on target environment
- [ ] Decide whether to run seed data (usually no for production)
- [ ] Run lint/typecheck/tests in CI
- [ ] Validate auth flow and role-restricted actions manually
- [ ] Validate join request approval/rejection workflow
- [ ] Validate task transition and assignment behavior
- [ ] Confirm logs include `x-request-id` and safe metadata only
- [ ] Backup SQLite database file before deployment
- [ ] Confirm Docker migration service runs before app startup

## SQLite backup strategy

For file-based SQLite production-like deployments, create periodic snapshots of the DB file:

- DB file: `prisma/dev.db` (or your configured SQLite path)
- Backup command example:

```bash
sqlite3 prisma/dev.db ".backup './backups/taskflow-$(date +%Y%m%d-%H%M%S).db'"
```

Keep multiple rolling backups and test restore on a non-production environment.

For Docker Compose default setup, DB file is in volume-backed path `/app/data/taskflow.db`.
