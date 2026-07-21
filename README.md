# Shatha Events

A full-stack event-planning booking platform: clients browse vetted vendor services (decor, photography, catering, venues, entertainment), submit booking requests, and track them through a status pipeline; vendors manage their own service listings; admins run the pipeline end to end. Built on the MERN stack.

## Stack

- **Frontend** (`apps/web`): Next.js 14 (App Router) + TypeScript, Tailwind CSS, TanStack Query, React Hook Form + Zod, Recharts, Socket.IO client.
- **API** (`apps/api`): Express + TypeScript (ESM), MongoDB/Mongoose, JWT access tokens + rotating httpOnly refresh cookies, Socket.IO server.
- **Shared** (`packages/shared`): Zod schemas + inferred types imported by both sides — one source of truth for request/response shapes.
- **Monorepo**: pnpm workspaces.

## Prerequisites

- Node 20+, pnpm, a MongoDB instance (local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster).

## Setup

```sh
pnpm install
cp apps/api/.env.example apps/api/.env       # fill in MONGODB_URI + generate JWT secrets
cp apps/web/.env.local.example apps/web/.env.local
pnpm --filter @app/api seed                  # optional: demo accounts + sample data
pnpm dev                                     # runs the API on :4000 and web on :3000
```

Open http://localhost:3000. Seeded demo accounts (see `apps/api/seed.ts`), all sharing the password `Password123!`:

- Admin: `admin@shatha.events`
- Vendors: `amelia@decorco.example`, `noah@lensandlight.example`, `priya@savorcatering.example`, `marcus@venueworks.example`, `sofia@encoreent.example`
- Clients: `elena@example.com`, `james@example.com`, `grace@example.com`

## What's optional out of the box

The app runs fully with just `MONGODB_URI` + JWT secrets set — no other external accounts required:

- **File uploads** default to local disk storage (`STORAGE_DRIVER=local`). Set `STORAGE_DRIVER=cloudinary` + the three `CLOUDINARY_*` vars for durable, CDN-backed storage instead.
- **Email** defaults to a console/log driver (`EMAIL_DRIVER=console`, writes to `apps/api/.email-log.txt`). Set `EMAIL_DRIVER=resend` + `RESEND_API_KEY` to send real email.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run API + web together |
| `pnpm --filter @app/api test` | Run the API test suite (unit + real-MongoDB integration tests) |
| `pnpm --filter @app/web test` | Run the frontend component tests |
| `pnpm typecheck` / `pnpm lint` | Static checks across all packages |
| `pnpm --filter @app/api seed` | Populate demo data |

## Deploying to Render

`render.yaml` in the repo root is a [Render Blueprint](https://render.com/docs/infrastructure-as-code) defining two web services: `shatha-events-api` (Express, Node runtime) and `shatha-events-web` (Next.js, Node runtime — it needs a real server, not a static export, since the app uses dynamic routes and middleware).

Render has no managed MongoDB, so the database is external:

1. **Create a MongoDB Atlas cluster** (free M0 tier, no card required): [atlas.mongodb.com](https://www.mongodb.com/cloud/atlas/register) → create a cluster → add a database user → allow network access from anywhere (`0.0.0.0/0`, since Render's IPs aren't static) → copy the connection string.
2. **Push this repo to GitHub**, then in the Render dashboard: **New → Blueprint**, connect the repo. Render reads `render.yaml` and previews the 2 services it's about to create — review before confirming.
3. **After the first deploy**, set the secrets left blank on purpose (`sync: false` in `render.yaml`):
   - `MONGODB_URI` on **shatha-events-api** — paste the Atlas connection string from step 1 (include a database name in the path, e.g. `.../shatha_events?retryWrites=true...`).
   - Optionally `CLOUDINARY_*` or `RESEND_API_KEY` if you want durable uploads / real email instead of the zero-account defaults.
4. **Confirm the predicted URLs match reality.** `render.yaml` hardcodes `CLIENT_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SOCKET_URL` as `https://shatha-events-{web,api}.onrender.com` — Render appends a suffix instead if either name was already taken. If that happens: update `CLIENT_URL` on the API service, and update+**redeploy** the web service (its `NEXT_PUBLIC_*` vars are baked into the build, so a value-only change needs a rebuild, not just a restart) to match the actual assigned URLs.
5. **Run the seed script once**, if you want demo data on the deployed instance: Render dashboard → shatha-events-api → Shell → `pnpm --filter @app/api seed`.

**Free-tier caveats**: free web services spin down after inactivity (~30-60s cold start on the next request); local-disk uploads (`STORAGE_DRIVER=local`) don't persist across redeploys on Render's ephemeral filesystem — fine for a demo, switch to Cloudinary for anything that needs to last.
