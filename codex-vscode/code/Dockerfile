# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
WORKDIR /app
ENV DATABASE_URL=file:./prisma/dev.db

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS builder
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

RUN apk add --no-cache dumb-init su-exec \
  && addgroup -S nodejs -g 1001 \
  && adduser -S nextjs -u 1001 -G nodejs

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm run prisma:generate && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY docker/entrypoint.sh /app/docker/entrypoint.sh

RUN chmod +x /app/docker/entrypoint.sh \
  && mkdir -p /app/prisma/data \
  && chown -R nextjs:nodejs /app

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--", "/app/docker/entrypoint.sh"]
