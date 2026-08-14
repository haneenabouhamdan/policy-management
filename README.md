# Policy Management

Monorepo for a configurable policy management app.

## Apps

- `apps/api` — NestJS + TypeORM + PostgreSQL
- `apps/web` — React (Vite)

## Requirements

- Node 20+
- pnpm 9+
- Docker

Postgres is exposed on host port `5433` (see `.env`).

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

## Auth

JWT bearer auth. Roles: `ADMIN`, `UNDERWRITER`, `VIEWER`.

Default users (seeded on first boot if the users table is empty):

| Email | Password | Role |
|-------|----------|------|
| admin@local.dev | Admin123! | ADMIN |
| underwriter@local.dev | Underwriter123! | UNDERWRITER |
| viewer@local.dev | Viewer123! | VIEWER |

In Swagger: `POST /auth/login` → Authorize with the returned `accessToken`.

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Current user |
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
