FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ---
FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/contexts/package.json ./packages/contexts/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
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

COPY --from=builder /app /tmp/build

RUN cd /tmp/build && pnpm --filter=api deploy --prod /app && \
    rm -rf /tmp/build

COPY --from=builder /app/apps/api/dist ./dist

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 4000

CMD ["node", "dist/main.js"]
