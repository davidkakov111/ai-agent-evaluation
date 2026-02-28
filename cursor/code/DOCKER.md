# TaskFlow Docker Setup

Production-ready Docker configuration for TaskFlow.

## Quick Start

```bash
# 1. Create .env with required variables
cp .env.docker.example .env
# Edit .env and set NEXTAUTH_SECRET (required)
# Generate with: openssl rand -base64 32

# 2. Start the application
docker compose up
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXTAUTH_SECRET` | Yes | - | Secret for JWT signing. Must be at least 32 characters. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | No | `http://localhost:3000` | Public URL of the app. Set to your domain for production (e.g. `https://app.example.com`) |
| `DATABASE_URL` | No | `file:/app/data/taskflow.db` | SQLite database path. Override only if using a different path |

## What Happens on Startup

1. **Migrations**: Prisma migrations run automatically via `prisma migrate deploy`
2. **Database**: SQLite database is created at `/app/data/taskflow.db` (persisted in Docker volume)
3. **Application**: Next.js server starts on port 3000

## Production Deployment

1. Set `NEXTAUTH_URL` to your public URL (e.g. `https://app.example.com`)
2. Use a strong `NEXTAUTH_SECRET` (32+ characters)
3. Consider adding a reverse proxy (nginx, Caddy) for TLS termination
4. The SQLite database is stored in the `taskflow_data` volume; back it up regularly

## Optional: Seed Database

To seed the database with sample users and data:

```bash
docker compose exec app node prisma/seed.mjs
```

## Production Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| **SQLite in production** | SQLite is suitable for single-instance deployments. For horizontal scaling, migrate to PostgreSQL and update Prisma schema. |
| **In-memory rate limiter** | Auth rate limiting is per-container. With multiple replicas, limits apply per instance. For distributed limiting, use Redis. |
| **No TLS in container** | Run behind a reverse proxy (nginx, Caddy, Traefik) for HTTPS. |
| **Image size** | Full `node_modules` is included for Prisma migrations. Image is ~500MB. For smaller images, consider running migrations in a separate init job. |

## Files

- `Dockerfile` - Multi-stage production build
- `docker-compose.yaml` - Service definition with volume and health check
- `docker-entrypoint.sh` - Runs migrations, then starts the app
- `.dockerignore` - Excludes dev files from build context
- `.env.docker.example` - Template for required environment variables
