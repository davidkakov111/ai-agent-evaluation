# Server Architecture Boundaries

## Layer Rules

- `src/server/db`: Prisma client creation and lifecycle only.
- `src/server/repositories`: Database reads/writes only.
- `src/server/services`: Business logic, transactions, and orchestration.
- `src/server/policies`: Authorization and invariant guards.
- `src/server/errors`: Domain error taxonomy and transport mapping.
- `src/server/trpc`: API transport, context wiring, and procedure definitions.

## Enforcement

- Direct `@prisma/client` imports are blocked by ESLint outside:
  - `src/server/db`
  - `src/server/repositories`
  - `src/server/services`
- `src/app`, `src/features`, and `src/lib` cannot import `@/server/db/*`.

## Review Checklist

- No Prisma imports in UI modules (`src/app`, `src/features`).
- tRPC routers call services, not Prisma.
- Repositories do not contain authorization decisions.
- Services throw domain errors; transport layer maps them once.
