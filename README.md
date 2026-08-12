# Policy Management

Monorepo for a configurable policy management app.

## Apps

- `apps/api` — NestJS + TypeORM + PostgreSQL
- `apps/web` — React (Vite)

## Requirements

- Node 20+
- pnpm 9+
- Docker

## Setup

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm --filter @policy-management/api migration:run
```

## Develop

```bash
pnpm dev:api
pnpm dev:web
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- Web: http://localhost:5173

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET/POST | `/policy-types` | List / create product schemas |
| GET | `/policy-types/:id` | Type detail |
| GET/POST | `/policies` | List (search/filter) / create |
| GET/PATCH | `/policies/:id` | Detail / update |
| PATCH | `/policies/:id/status` | Status transition |

## Tests

```bash
pnpm --filter @policy-management/api test
```
