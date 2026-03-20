FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ---
FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile

# ---
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/ ./
COPY . .

RUN pnpm run build --filter=api

# ---
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /tmp/root/
COPY --from=builder /app/apps/api/package.json /tmp/root/apps/api/package.json

RUN cd /tmp/root && pnpm install --frozen-lockfile --prod --filter=api && \
    cp -rL /tmp/root/apps/api/node_modules /app/node_modules && \
    rm -rf /tmp/root

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 4000

CMD ["node", "dist/main.js"]
