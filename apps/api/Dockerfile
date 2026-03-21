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

# Build packages and API
RUN pnpm run build --filter=@repo/contexts --filter=@repo/contracts && \
    pnpm --filter api run build

# Patch contexts exports to point to dist for production
RUN node -e " \
  const pkg = require('./packages/contexts/package.json'); \
  pkg.exports = { './*': './dist/*/index.js' }; \
  require('fs').writeFileSync('./packages/contexts/package.json', JSON.stringify(pkg, null, 2));"

RUN node -e " \
  const pkg = require('./packages/contracts/package.json'); \
  pkg.exports = { './*': './dist/*/index.js' }; \
  require('fs').writeFileSync('./packages/contracts/package.json', JSON.stringify(pkg, null, 2));"

# ---
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/contexts/dist ./packages/contexts/dist
COPY --from=builder /app/packages/contexts/node_modules ./packages/contexts/node_modules
COPY --from=builder /app/packages/contexts/package.json ./packages/contexts/package.json
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=builder /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
