# TaskFlow

TaskFlow is a multi-tenant task management SaaS built with Next.js App Router, tRPC, Prisma, SQLite, Auth.js, and strict TypeScript.

## Stack
- Next.js App Router
- tRPC + Zod contracts
- Prisma ORM (`sqlite`)
- Auth.js (database sessions)
- Vitest (unit/service/API tests)

## Environment
Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `BCRYPT_SALT_ROUNDS`
- `NODE_ENV`

Optional auth throttling variables (defaults shown in `.env.example`):
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_LOGIN_MAX_ATTEMPTS`
- `AUTH_REGISTER_MAX_ATTEMPTS`

## Local Development
```bash
npm install
npm run setup
npm run dev
```

`npm run setup` runs Prisma generate, migration, and seed for local sanity data.

## Docker Compose (Production Mode)
Create a runtime env file from Docker defaults:

```bash
cp .env.docker.example .env
```

Then set a strong `NEXTAUTH_SECRET` value in `.env`, and start:

```bash
docker compose up --build
```

Container startup behavior:
- Runs `prisma migrate deploy` automatically before app boot.
- Starts Next.js in production mode (`next start`).
- Serves the app on `http://localhost:${APP_PORT}`.

Database persistence:
- SQLite file is stored in Docker volume `taskflow_sqlite` at `/app/prisma/data/taskflow.db`.
- Data persists across container restarts/recreates unless the volume is removed.

## Quality Gates
```bash
npm run prisma:validate
npm run typecheck
npm run lint
npm run test
npm run build
```

## Migration Flow
Development:
```bash
npm run prisma:migrate:dev
```

Production/deployment:
```bash
npm run prisma:migrate:deploy
```

Start production server with migration step:
```bash
npm run start:prod
```

## Runtime Hardening
- App Router error boundaries are implemented in `src/app/error.tsx` and `src/app/global-error.tsx`.
- Server-side failures use structured JSON logging via `src/server/logging/logger.ts`.
- Domain errors are mapped to stable tRPC error codes centrally.

## SQLite v1 Constraints
- SQLite is file-based and not suitable for multi-instance horizontal writes.
- SQLite backups are file backups of the DB and companion WAL/SHM files.
- If write concurrency or HA is needed, migrate to Postgres.

## Postgres Migration Path (Planned)
1. Switch Prisma datasource provider to `postgresql`.
2. Update `DATABASE_URL` to Postgres connection string.
3. Run `prisma migrate deploy` in target environment.
4. Keep repositories/services unchanged to preserve architecture boundaries.
