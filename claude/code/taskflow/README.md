# TaskFlow

A multi-tenant task management SaaS built with Next.js 16, tRPC v11, Auth.js v5, Prisma 7, and SQLite.

## Architecture

```
src/
├── app/                     # Next.js App Router pages
│   ├── (auth)/              # Login & register (public)
│   ├── dashboard/           # Protected dashboard pages
│   └── api/                 # tRPC + Auth.js API routes
├── components/              # Shared React components + shadcn/ui
├── lib/
│   ├── constants.ts         # MemberRole, TaskStatus, JoinRequestStatus
│   ├── validators/          # Zod schemas (shared client/server)
│   └── trpc/                # tRPC client, server caller, query client
├── server/
│   ├── auth.ts              # Auth.js v5 config (Credentials + JWT)
│   ├── db.ts                # Prisma client singleton
│   ├── services/            # Business logic (auth, org, task, join-request)
│   └── trpc/                # tRPC routers, context, middleware
└── proxy.ts                 # Route protection (Next.js 16 proxy)
```

**Key design decisions:**
- Business logic is isolated in service files, separate from tRPC routers
- Four-level tRPC middleware chain: public -> protected -> orgMember -> orgAdmin
- Zod schemas are shared between client-side validation and server-side input parsing
- SQLite via `@prisma/adapter-better-sqlite3` for zero-config local development

## Features

- **User accounts** with email/password registration and JWT-based sessions
- **Organizations** with OWNER/ADMIN/EMPLOYEE roles
- **Join request system** (PENDING/APPROVED/REJECTED) with admin review
- **Task management** with TODO/IN_PROGRESS/DONE states and role-based access control
- **Dashboard** with conditional views for users with/without an organization

## Quick Start (Docker)

```bash
# 1. Create your environment file
cp .env.docker .env.docker.local
# Edit .env.docker.local and set AUTH_SECRET to a random value:
#   openssl rand -hex 32

# 2. Start everything
docker compose --env-file .env.docker.local up
```

The application will be available at `http://localhost:3000`.

On first start, Prisma migrations run automatically to create the SQLite database. Data persists in a Docker volume (`taskflow-data`).

### Environment Variables (Docker)

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | Secret for signing JWT tokens. Generate with `openssl rand -hex 32` |
| `AUTH_TRUST_HOST` | No | Set to `true` (default in compose) to trust the `Host` header |
| `DATABASE_URL` | No | SQLite path (default: `file:/data/taskflow.db` on the volume) |

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create database and apply migrations
npm run db:migrate

# Start development server
npm run dev
```

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="your-secret-key-here"
AUTH_TRUST_HOST=true
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:migrate` | Create new migration (development) |
| `npm run db:migrate:deploy` | Apply pending migrations (production) |
| `npm run db:push` | Push Prisma schema to database (no migration) |
| `npm run db:studio` | Open Prisma Studio GUI |

## Testing

Tests use Vitest with mocked Prisma client for fast, isolated unit tests:

```bash
npm test
```

Test coverage:
- **auth.service** -- registration, credential verification, password hashing, duplicate detection
- **org.service** -- creation with OWNER assignment, duplicate org prevention
- **join-request.service** -- request lifecycle, approval/rejection flows, guard clauses
- **task.service** -- CRUD, status transitions, role-based access (admin vs employee), cross-org isolation

## User Flow

1. **Register** at `/register` with email, name, password
2. **Log in** at `/login`
3. **Dashboard** shows options to create or join an organization
4. **Create organization** to become OWNER, or browse and request to join existing ones
5. **Admins** approve/reject join requests and assign roles (ADMIN or EMPLOYEE)
6. **Create tasks**, assign to members, and track progress through TODO -> IN_PROGRESS -> DONE
7. **Employees** see only their assigned tasks and can update status

## Tech Stack

- **Next.js 16** (App Router, Server Components, `proxy` convention)
- **TypeScript** (strict mode, no `any`)
- **tRPC v11** (with TanStack React Query v5)
- **Auth.js v5** (Credentials provider, JWT sessions)
- **Prisma 7** (with `@prisma/adapter-better-sqlite3`)
- **SQLite** (file-based, zero-config)
- **Zod 4** (all input validation)
- **Tailwind CSS 4** + **shadcn/ui** (component library)
- **Vitest 4** (unit testing)
