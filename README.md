# Agents Fleet

[![Tests](https://github.com/josue22almo/agents-fleet/actions/workflows/ci.yml/badge.svg)](https://github.com/josue22almo/agents-fleet/actions/workflows/ci.yml)
[![Test Reports](https://img.shields.io/badge/test_reports-live-blue)](https://josue22almo.github.io/agents-fleet/)

A multi-tenant dashboard for monitoring AI agents metrics and performance. Connect agents like Claude, Manus, and others to track runs, response times, and set up alarms — all from a single pane of glass.

## Features

- **Multi-tenant support** — individual and team organizations with role-based access (owner, admin, member)
- **Authentication** — signup, login, forgot/reset password
- **Organization management** — create teams, invite members by email, manage roles
- **Metrics dashboard** — overview of agents, active runs, response times, and alarms (coming soon)
- **Agent connections** — connect and monitor different AI agents (coming soon)
- **Alarms** — configurable alerts for agent performance thresholds (coming soon)

## Architecture

The project follows **DDD with hexagonal architecture** in a **Turborepo monorepo**:

```
apps/
  api/          → NestJS REST API
  web/          → Next.js 16 frontend (App Router, shadcn/ui)

packages/
  contexts/     → Domain logic (entities, use cases, ports, infrastructure)
  contracts/    → Shared Zod schemas for API request/response types
```

**Key principles:**
- Inner layers (domain, use cases) depend on interfaces, not implementations
- Framework code (NestJS controllers, Next.js pages) lives in apps, not packages
- Event-driven side effects via domain events and handlers
- Supabase for auth and persistence with per-request RLS clients

For detailed architecture documentation, see:
- [Backend Architecture](docs/backend-architecture.md)
- [Frontend Architecture](docs/frontend-architecture.md)
- [Multi-tenant PRD](docs/prd/multi-tenant.md)

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- Supabase project with the migrations applied
- Docker (for deployment)

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations
# Apply files in supabase/migrations/ via Supabase SQL editor

# Seed test data
pnpm db:seed

# Start development
pnpm run dev
```

The API runs on `http://localhost:4000` and the web app on `http://localhost:3000`.

## Testing

```bash
# Unit tests (all packages)
pnpm -r run test

# Unit tests with coverage
pnpm -r run test -- --coverage

# E2E tests (Playwright)
pnpm --filter web e2e

# E2E with browser UI
pnpm --filter web e2e:ui
```

## Deployment

The project deploys via Docker Compose with Traefik for HTTPS:

```bash
docker compose build
docker compose up -d
```

Set Supabase and SMTP environment variables in your deployment platform (e.g., Dokploy).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend | NestJS, TypeScript, Supabase (Auth + Postgres) |
| Shared | Zod (validation), Vitest (unit tests), Playwright (E2E) |
| Infra | Docker, Turborepo, pnpm, GitHub Actions CI |
