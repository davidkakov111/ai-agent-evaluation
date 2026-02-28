# syntax=docker/dockerfile:1
# TaskFlow - Production Dockerfile
# Multi-stage build for minimal final image

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-slim AS deps
WORKDIR /app

# Install dependencies for native modules (better-sqlite3)
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

# All dependencies (including dev for build)
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app

# Build dependencies for native modules
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# DATABASE_URL required for Prisma generate (use placeholder for build)
ENV DATABASE_URL="file:./prisma/build.db"

RUN npm run prisma:generate && npm run build

# -----------------------------------------------------------------------------
# Stage 3: Runner (minimal production image)
# -----------------------------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

# Install curl for healthcheck (minimal)
RUN apt-get update -y && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1001 --system nodejs \
    && useradd --uid 1001 --system --gid nodejs nextjs

# Create data directory for SQLite (must be writable)
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./

# Full node_modules for Prisma CLI (migrations) - standalone has minimal deps for runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# DATABASE_URL must be set at runtime (default for local dev)
ENV DATABASE_URL="file:/app/data/taskflow.db"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
