# Policy Management

Products define a JSON schema. Policies store attributes against that schema, so a new product or field does not need a new screen or migration.

- `apps/api` — NestJS + TypeORM + PostgreSQL
- `apps/web` — React (Vite)

Live demo (same seeded logins as below): https://web-production-f9d422.up.railway.app  
Swagger: https://web-production-f9d422.up.railway.app/api/docs

## Architecture

The website talks to the API over `/api`. In Docker, nginx serves the React app and forwards `/api` to Nest. The API sets `app.tenant_id` on the Postgres connection so row-level security only returns that office’s rows. Migrations and seed run as `postgres`; the running API uses `policy_app`.

![Architecture diagram](docs/architecture.png)

## Database schema

Shared tables, one database. Each office is a `tenants` row. Product-specific answers live in `policies.attributes` JSONB, not extra columns. `policy_types.schema` is the form definition.

![Database schema](docs/schema.png)

- Unique email and product name are **per office** (`tenant_id` + email / name).
- `tenants` is not behind RLS (login must look up `atom` / `northwind`).
- `users`, `policy_types`, `policies`, and both event tables are behind RLS.
- Status: `DRAFT` → `ACTIVE` or `INACTIVE`; `INACTIVE` → `ACTIVE` needs a reason.

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

Each login is scoped to one tenant. Pick the MGA (slug) on the sign-in screen so the same email can exist in two books. Atom Coverholder is the original book; Northwind MGA is a second tenant so isolation is easy to check.

**Atom Coverholder** (`atom`)

| Email                     | Password        | Role        |
| ------------------------- | --------------- | ----------- |
| maya.hassan@atomcover.com | Admin123!       | ADMIN       |
| omar.khalil@atomcover.com | Underwriter123! | UNDERWRITER |
| lina.farhat@atomcover.com | Viewer123!      | VIEWER      |
| alex.rivera@example.com   | Underwriter123! | UNDERWRITER |

**Northwind MGA** (`northwind`)

| Email                          | Password        | Role        |
| ------------------------------ | --------------- | ----------- |
| james.okonkwo@northwindmga.com | Admin123!       | ADMIN       |
| priya.shah@northwindmga.com    | Underwriter123! | UNDERWRITER |
| alex.rivera@example.com        | Underwriter123! | UNDERWRITER |

`alex.rivera@example.com` is the same address in both MGAs; the slug decides which book you open.

- `ADMIN` — policies and products
- `UNDERWRITER` — create / edit / status-change policies
- `VIEWER` — read only

The API connects as a non-superuser (`policy_app`) so Postgres row-level security is actually enforced. Migrations and seed still run as `postgres` (`DB_ADMIN_USER`).

Tests (needs Node 20+ and pnpm 9+):

```bash
pnpm install
pnpm test
```

API HTTP tests against a running Postgres (same `.env` as local/dev; Docker `pnpm db:up` first):

```bash
pnpm test:api:e2e
```

Browser path. Playwright starts a dedicated API on port `3001` and Vite on `5174` so it does not collide with Docker on `3000`/`5173`. Postgres must still be up (`pnpm db:up`):

```bash
pnpm --filter @policy-management/web exec playwright install chromium
pnpm test:e2e
```

`pnpm test:all` runs unit tests, API HTTP tests, and Playwright.

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

**Product schema vs policy instance.** A `PolicyType` owns the field definition (`schema` JSONB). A `Policy` is one filled-in instance (`attributes` JSONB) plus status. Travel, Property, Membership, and Cargo are seed data, not dedicated tables or screens. The same `SchemaForm` / `SchemaReadView` render whatever the product says. The read view also shows constraint hints (required, min/max, allowed values). Detail can export a working-copy PDF of every schema field, including blanks, so a missing value is visible; it is not a legal document.

**Hybrid Postgres model.** Identity, status, timestamps, and tenant stay as columns. Product-specific fields stay in JSONB. A column per field would need a migration for every product change. An EAV table makes filtering and reporting awkward.

**Validation at the schema boundary.** Zod builds a validator from the product schema on create/update. “Rules” in this slice are required, min/max, enums, and types — not a pricing or underwriting engine. The API is the source of truth; the form mirrors those constraints.

**Search without loading JSONB on the list.** On write, name and simple values are flattened into `search_text` (GIN trigram). Typed filters (e.g. Travel `regions = UAE`) use JSONB `@>` after a product is selected. List queries do not select `attributes`.

**Schema versions.** The product version bumps only when fields change. Each policy keeps the version it was saved against. Saving again validates against the current product. Older rows get a banner; the list can filter to them. Existing policies are not auto-migrated.

**Status as a small state machine.** `DRAFT → ACTIVE|INACTIVE`, `ACTIVE → INACTIVE`, `INACTIVE → ACTIVE` with a required reason. Illegal transitions return 400.

**JWT + three roles.** Viewers read, underwriters write policies, admins also manage products. Writes are throttled. Cross-tenant ids return 404, not 403, so existence is not leaked.

**Shared-schema multi-tenancy.** `tenant_id` on users, products, and policies. Login requires a tenant slug. The JWT tenant comes from the user row. Unique names and emails are per tenant. Postgres RLS (`SET` `app.tenant_id` on the pooled connection) is a second layer so a missed `WHERE` cannot leak rows. The `tenants` table is not RLS-gated so slug lookup still works.

**Keyset list pagination.** Policy lists page with `after` (`updatedAt` + `id`), not offsets. Each response includes `nextCursor` and `hasMore`. HTTP logs are JSON with `requestId`, method, path, status, duration, and `tenantId`. Pass or receive `X-Request-Id`.

## Assumptions

- This is an internal ops workbench (MGA / coverholder), not a consumer quote site.
- One user belongs to one tenant. The same email can exist in two MGAs; login always includes a slug.
- “Rules or conditions” means schema constraints and status transitions, not if/then underwriting or rating.
- Schema changes do not rewrite historical policies. Underwriters update a record when they next edit it.
- Seeded history is empty until a row is written through the API.
- Keyset pagination is enough for the demo book; the dashboard strip still uses full counts.
- Docker is the default way to run; Node/pnpm is for local iteration.

## Trade-offs considered

| Choice                     | Instead of                     | Why                                                                               |
| -------------------------- | ------------------------------ | --------------------------------------------------------------------------------- |
| JSONB attributes           | Extra columns or EAV           | New products/fields without migrations; typed SQL filters still possible via `@>` |
| Denormalized `search_text` | Searching JSONB on every list  | Keeps the hot path indexed and avoids loading attributes                          |
| Keyset pagination          | Offset (`page` / `totalPages`) | Stable under inserts; no `COUNT(*)` on the hot list                               |
| Shared schema + RLS        | Separate databases per MGA     | One compose stack, two demo MGAs, and a missed `WHERE` still cannot leak rows     |
| JWT seeded users           | Cognito / SSO                  | Fits a 2–3 day slice; an IdP is the regulated-ops path                            |
| Version stamp + banner     | Auto-migrate old policies      | Honest about schema drift; no silent data rewrite                                 |

## What I would do with more time

- Attachments on S3, an IdP instead of seeded users, and a real deploy (ECS/ALB, Aurora).
- Issued policy documents (letterhead, versioning, e-sign) rather than the working-copy snapshot PDF.
- AI on the policy book: a copilot that recommends the product and fields from a short brief, flags missing required attributes and wording gaps against the current schema, and surfaces similar in-force policies so underwriters are not starting from a blank form. Natural-language search over `search_text` plus attributes would sit on the same path. Document intake (once attachments exist) could pre-fill JSONB attributes instead of typing them.

## Swagger

API routes and schemas: http://localhost:3000/docs

`POST /auth/login` with `tenantSlug`, then Authorize with `accessToken`.
