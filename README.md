# Policy Management

Products define a JSON schema. Policies store attributes against that schema, so a new product or field does not need a new screen or migration.

## Apps

- `apps/api` — NestJS + TypeORM + PostgreSQL
- `apps/web` — React (Vite)

## Requirements

- Docker (Compose v2)

## Run

```bash
cp .env.example .env
docker compose up --build
```

- App: http://localhost:5173
- API: http://localhost:3000
- Swagger: http://localhost:3000/docs

Compose starts Postgres, the API, and the web app. On first boot the API runs migrations and seeds products, policies, and local users.

Stop with Ctrl+C, or run `docker compose up --build -d` to start in the background.

## Local users

Seeded on first boot if the users table is empty:

| Email | Password | Role |
|-------|----------|------|
| admin@local.dev | Admin123! | ADMIN |
| underwriter@local.dev | Underwriter123! | UNDERWRITER |
| viewer@local.dev | Viewer123! | VIEWER |

- `ADMIN` — policies and products
- `UNDERWRITER` — create / edit / status-change policies
- `VIEWER` — read only

Swagger: `POST /auth/login`, then Authorize with `accessToken`.

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Current user |
| GET | `/health` | Health check |
| GET/POST | `/policy-types` | List / create product schemas |
| GET/PATCH | `/policy-types/:id` | Type detail / update |
| GET | `/policy-types/:id/events` | Product edit history |
| GET | `/policies/summary` | Counts by status / product / stale schema |
| GET/POST | `/policies` | List (`q`, `typeId`, `status`, `attrKey`/`attrValue`, `staleSchema`) / create |
| GET/PATCH | `/policies/:id` | Detail / update |
| PATCH | `/policies/:id/status` | Status transition |
| GET | `/policies/:id/events` | Activity timeline |

## Local development

Node 20+, pnpm 9+, and Docker (for Postgres only):

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm --filter @policy-management/api migration:run
pnpm seed
pnpm dev:api
pnpm dev:web
```

Postgres is on host port `5433` (see `.env`).

## Tests

```bash
pnpm --filter @policy-management/api test
```

## Notes

- Product schema version is the current form. Each policy stores the version it was saved against.
- Status: `DRAFT → ACTIVE → INACTIVE` (also `DRAFT → INACTIVE`).
- List search uses `search_text` + `pg_trgm`. Attribute filters use JSONB `@>`.
- Pagination is offset-based (`limit` max 100). List queries do not load `attributes`.
