# TaskFlow

Multi-tenant task management SaaS built with Next.js, tRPC, Prisma, SQLite, and Auth.js.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and configure:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `NEXTAUTH_SECRET` to a secure random string (at least 32 characters).

3. Run database migrations:

   ```bash
   npm run prisma:migrate:dev
   ```

4. Seed the database with sample data:

   ```bash
   npm run prisma:seed
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker (Production)

Run the application with Docker Compose:

1. Create `.env` with required variables:

   ```bash
   cp .env.docker.example .env
   ```

   Edit `.env` and set `NEXTAUTH_SECRET` to a secure random string (at least 32 characters).

2. Start the application:

   ```bash
   docker compose up
   ```

   Migrations run automatically on startup. The app is available at [http://localhost:3000](http://localhost:3000).

   For production deployment, set `NEXTAUTH_URL` to your public URL (e.g. `https://app.example.com`).

   See [DOCKER.md](DOCKER.md) for detailed Docker documentation.

## Scripts

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run start` – Start production server
- `npm run lint` – Run ESLint (max-warnings 0)
- `npm run typecheck` – Run TypeScript check
- `npm run test` – Run unit tests
- `npm run setup` – Generate Prisma client, run migrations, and seed

## Tech Stack

- **Next.js 16** – App Router
- **tRPC** – Type-safe API
- **Prisma** – ORM with SQLite
- **Auth.js (NextAuth)** – Authentication
- **Zod** – Validation
- **Tailwind CSS** – Styling
