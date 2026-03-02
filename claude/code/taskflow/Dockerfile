FROM node:22-alpine AS base

# ------- deps: install all dependencies -------
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ------- builder: build the application -------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# ------- prisma-cli: minimal Prisma CLI for running migrations -------
FROM base AS prisma-cli
WORKDIR /prisma-cli

RUN npm init -y > /dev/null 2>&1 && \
    npm install --save-exact prisma@7.4.2 dotenv@17.3.1 > /dev/null 2>&1 && \
    npm cache clean --force > /dev/null 2>&1

# ------- runner: production image -------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Prisma CLI (isolated install for `prisma migrate deploy`)
COPY --from=prisma-cli /prisma-cli /prisma-cli

# Prisma schema, migrations, and config
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Next.js standalone output (server + minimal traced node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# prisma.config.ts imports dotenv/config — link it from the CLI install
RUN ln -s /prisma-cli/node_modules/dotenv ./node_modules/dotenv

# Entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Data directory for SQLite (mounted as volume)
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
