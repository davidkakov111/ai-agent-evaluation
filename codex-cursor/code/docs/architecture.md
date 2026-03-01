# TaskFlow Architecture

TaskFlow is a multi-tenant task management SaaS built with Next.js App Router, tRPC, Prisma, and SQLite.

## System overview

- **UI layer:** `src/app` (route groups and layouts) + `src/features/*` (feature-specific client components).
- **API layer:** tRPC routers in `src/server/api/routers`.
- **Domain layer:** business rules in `src/server/services`.
- **Persistence layer:** repositories in `src/server/repositories` using Prisma.
- **Auth layer:** Auth.js credentials flow in `src/server/auth` and `/api/auth`.

## Multi-tenant model

- Tenant boundary is `organizationId`.
- Task and join request operations must be organization-scoped.
- Policies enforce auth, org membership, and role checks before mutations.

## Request flow

1. Request enters App Router route (`/api/trpc` or `/api/auth/*`).
2. Middleware injects request correlation ID (`x-request-id`).
3. tRPC/Auth handlers validate input via Zod.
4. Services enforce business invariants and transition rules.
5. Repositories execute Prisma operations with scoped queries.
6. Structured logs are emitted for sensitive/critical operations.

## Transition and workflow guarantees

- **Join requests:** only `PENDING -> APPROVED|REJECTED`.
- **Task statuses:** enforced transition matrix in service layer.
- Join approval + membership creation occur in one transaction.
- Race-safe decision updates prevent double-approval/rejection.

## Observability

- Structured logs (`src/lib/logger.ts`) for:
  - auth credential outcomes
  - registration results
  - join-request decisions
  - task create/assign/status operations
  - tRPC endpoint errors
- Correlation IDs are generated/preserved in middleware and propagated via `x-request-id`.

## Operational constraints

- SQLite is file-based and can lock under heavy concurrent writes.
- Prefer one app instance for local SQLite usage.
- For heavier production concurrency, migrate to a server-grade database.
