# Policy Management

Products define a JSON schema. Policies store attributes against that schema, so a new product or field does not need a new screen or migration.

- `apps/api` — NestJS + TypeORM + PostgreSQL
- `apps/web` — React (Vite)

## How to run the application

Docker Compose v2:

```bash
cp .env.example .env
docker compose up --build
```

- App: http://localhost:5173
- API: http://localhost:3000
- Swagger: http://localhost:3000/docs

Compose starts Postgres, the API, and the web app. On first boot the API runs migrations and seeds products, policies, and local users.

Stop with Ctrl+C, or run `docker compose up --build -d` to start in the background.

Each login is scoped to one tenant. Atom Coverholder is the original book; Northwind MGA is a second tenant so isolation is easy to check.

**Atom Coverholder**

| Email | Password | Role |
|-------|----------|------|
| maya.hassan@atomcover.com | Admin123! | ADMIN |
| omar.khalil@atomcover.com | Underwriter123! | UNDERWRITER |
| lina.farhat@atomcover.com | Viewer123! | VIEWER |

**Northwind MGA**

| Email | Password | Role |
|-------|----------|------|
| james.okonkwo@northwindmga.com | Admin123! | ADMIN |
| priya.shah@northwindmga.com | Underwriter123! | UNDERWRITER |

- `ADMIN` — policies and products
- `UNDERWRITER` — create / edit / status-change policies
- `VIEWER` — read only

Swagger: `POST /auth/login`, then Authorize with `accessToken`.

Tests (needs Node 20+ and pnpm 9+):

```bash
pnpm install
pnpm --filter @policy-management/api test
pnpm --filter @policy-management/web test
```

Local development without containerizing the app (Docker still used for Postgres):

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

## Key design decisions

**Product schema vs policy instance.** A `PolicyType` owns the field definition (`schema` JSONB). A `Policy` is one filled-in instance (`attributes` JSONB) plus status. Travel, Property, Membership, and Cargo are seed data, not dedicated tables or screens. The same `SchemaForm` / `SchemaReadView` render whatever the product says.

**Hybrid Postgres model.** Identity, status, timestamps, and tenant stay as columns. Product-specific fields stay in JSONB. A column per field would need a migration for every product change. An EAV table makes filtering and reporting awkward.

**Validation at the schema boundary.** Zod builds a validator from the product schema on create/update. “Rules” in this slice are required, min/max, enums, and types — not a pricing or underwriting engine. The API is the source of truth; the form mirrors those constraints.

**Search without loading JSONB on the list.** On write, name and simple values are flattened into `search_text` (GIN trigram). Typed filters (e.g. Travel `regions = UAE`) use JSONB `@>` after a product is selected. List queries do not select `attributes`.

**Schema versions.** The product version bumps only when fields change. Each policy keeps the version it was saved against. Saving again validates against the current product. Older rows get a banner; the list can filter to them. Existing policies are not auto-migrated.

**Status as a small state machine.** `DRAFT → ACTIVE|INACTIVE`, `ACTIVE → INACTIVE`, `INACTIVE → ACTIVE` with a required reason. Illegal transitions return 400.

**JWT + three roles.** Viewers read, underwriters write policies, admins also manage products. Writes are throttled. Cross-tenant ids return 404, not 403, so existence is not leaked.

**Shared-schema multi-tenancy.** `tenant_id` on users, products, and policies. The JWT tenant comes from the user row. Unique names and emails are per tenant.

## Assumptions

- This is an internal ops workbench (MGA / coverholder), not a consumer quote site.
- One user belongs to one tenant. Demo emails are globally distinct, so login is email + password with no tenant slug.
- “Rules or conditions” means schema constraints and status transitions, not if/then underwriting or rating.
- Schema changes do not rewrite historical policies. Underwriters update a record when they next edit it.
- Seeded history is empty until a row is written through the API.
- Offset pagination is enough for the demo book of business.
- Docker is the default way to run; Node/pnpm is for local iteration.

## Trade-offs considered

| Choice | Instead of | Why |
|--------|------------|-----|
| JSONB attributes | Extra columns or EAV | New products/fields without migrations; typed SQL filters still possible via `@>` |
| Denormalized `search_text` | Searching JSONB on every list | Keeps the hot path indexed and avoids loading attributes |
| Offset pagination | Keyset (`updated_at, id`) | Simpler UI and “page N of M”; keyset is better past tens of thousands of rows |
| App-level `tenant_id` | Separate databases, or Postgres RLS first | One compose stack, easy to demo two MGAs; RLS would be the production second layer |
| JWT seeded users | Cognito / SSO | Fits a 2–3 day slice; an IdP is the regulated-ops path |
| Version stamp + banner | Auto-migrate old policies | Honest about schema drift; no silent data rewrite |
| REST + OpenAPI | GraphQL | Matches the brief; Swagger is enough for the 1:1 |

## What I would do with more time

- Postgres row-level security (`SET LOCAL app.tenant_id`) so a missed `WHERE` cannot leak rows.
- Tenant slug or subdomain on login, so the same email can exist in two MGAs.
- Keyset pagination and structured request-id logs.
- Playwright path: login → create draft → activate → reactivate with a reason.
- Show constraint hints on the policy detail read view (required, min/max, allowed values), not only on the form.
- Attachments on S3, an IdP instead of seeded users, and a real deploy (ECS/ALB, Aurora).
- Out of scope on purpose: rating, claims, documents, email, bordereaux.

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
| POST | `/policies/:id/duplicate` | Clone as a new draft |
| GET/PATCH | `/policies/:id` | Detail / update |
| PATCH | `/policies/:id/status` | Status transition (`INACTIVE → ACTIVE` needs `reason`) |
| GET | `/policies/:id/events` | Activity timeline |
