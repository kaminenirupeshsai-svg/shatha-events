# Shatha Events

A full-stack event-planning booking platform: clients browse vetted vendor services (decor, photography, catering, venues, entertainment), submit booking requests, and track them through a status pipeline; vendors manage their own service listings; admins run the pipeline end to end. Built on the MERN stack.

## Features

- **Auth**: signup/login gated on a 6-digit email verification code, forgot/reset password, JWT access tokens + rotating httpOnly refresh cookies.
- **Roles**: client, vendor, admin, each with a dedicated dashboard.
- **Vendor vetting**: new vendor accounts start `pending` and can't list a service until an admin approves them.
- **Services**: browse/search/filter/sort, image uploads, full CRUD for the owning vendor.
- **Bookings**: multi-vendor requests through a status pipeline (pending → reviewed → confirmed → in progress → completed/cancelled), with same-day double-booking prevention per vendor.
- **Reviews & ratings**: clients rate each vendor after a completed booking; average ratings surface on listings.
- **Messaging**: a private per-vendor message thread on each booking.
- **Real-time**: live notifications, booking status changes, and messages over Socket.IO.
- **Admin dashboard**: analytics, manage bookings/services/vendor approvals.
- Contact form, Terms of Service, Privacy Policy.

## Stack

- **Frontend** (`apps/web`): Next.js 14 (App Router) + TypeScript, Tailwind CSS, TanStack Query, React Hook Form + Zod, Recharts, Socket.IO client.
- **API** (`apps/api`): Express + TypeScript (ESM), MongoDB/Mongoose, JWT access tokens + rotating httpOnly refresh cookies, Socket.IO server.
- **Shared** (`packages/shared`): Zod schemas + inferred types imported by both sides — one source of truth for request/response shapes.
- **Monorepo**: pnpm workspaces.

## Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) (`corepack enable`, or `npm install -g pnpm`)
- A MongoDB instance to point the app at — see below.

### Getting a local MongoDB running

Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) for your OS and start it — it listens on `127.0.0.1:27017` by default, which is exactly what `apps/api/.env.example`'s `MONGODB_URI` already points at, so no edits needed there once it's running.

- **Windows**: the installer offers to set it up as a background service automatically — once installed, it's just always running.
- **Mac**: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
- **Linux**: follow the [distro-specific instructions](https://www.mongodb.com/docs/manual/administration/install-on-linux/) on the download page.

No account, no internet connection needed after install, and no data leaves your machine — this is the right choice if you don't want to share a database with anyone else. (A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cloud cluster is the other option, useful if you want your data reachable from somewhere other than your own machine — not needed for a local demo.)

## Setup

```sh
pnpm install
cp apps/api/.env.example apps/api/.env       # generate JWT secrets (see below); MONGODB_URI's default already matches a local MongoDB install
cp apps/web/.env.local.example apps/web/.env.local
pnpm --filter @app/api seed                  # optional: demo accounts + sample data
pnpm dev                                     # runs the API on :4000 and web on :3000
```

Open http://localhost:3000. Seeded demo accounts (see `apps/api/seed.ts`), all sharing the password `Password123!` and already verified/approved so they can log in immediately:

- Admin: `admin@shatha.events`
- Vendors: `amelia@decorco.example`, `noah@lensandlight.example`, `priya@savorcatering.example`, `marcus@venueworks.example`, `sofia@encoreent.example`
- Clients: `elena@example.com`, `james@example.com`, `grace@example.com`

If you sign up a **new** account instead of using a seeded one, it needs a 6-digit verification code before it can log in — see the email note below for where to find it locally.

## What's optional out of the box

The app runs fully with just `MONGODB_URI` + JWT secrets set — no other external accounts required:

- **File uploads** default to local disk storage (`STORAGE_DRIVER=local`). Set `STORAGE_DRIVER=cloudinary` + the three `CLOUDINARY_*` vars for durable, CDN-backed storage instead — **required in production** on platforms with an ephemeral filesystem (see the Render caveats below), since local-disk uploads there vanish on every redeploy.
- **Email** defaults to a console/log driver (`EMAIL_DRIVER=console` — verification codes, password resets, contact-form messages, and booking notifications are printed to the terminal and appended to `apps/api/.email-log.txt` instead of being sent). Set `EMAIL_DRIVER=gmail` + `GMAIL_USER` + `GMAIL_APP_PASSWORD` (a Google [App Password](https://myaccount.google.com/apppasswords), not your real password) to send real email via Gmail SMTP, or `EMAIL_DRIVER=resend` + `RESEND_API_KEY` to use Resend instead.
- **Contact form delivery** defaults to `GMAIL_USER`'s inbox, falling back to `hello@shathaevents.com` if that's unset either. Override with `CONTACT_EMAIL`.

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
   - `GMAIL_USER` + `GMAIL_APP_PASSWORD` on **shatha-events-api** — `render.yaml` sets `EMAIL_DRIVER=gmail` by default, so without these, verification codes/notifications/contact messages are silently never delivered (logged server-side, not thrown — nothing visibly breaks, it just doesn't arrive). Optionally `CLOUDINARY_*` too, for durable uploads.
   - **`render.yaml`'s `value:` entries (like `EMAIL_DRIVER`) only apply when Render first creates a service from the blueprint.** If you change one later and just push the file, an *already-existing* service won't pick it up automatically — you have to update that variable directly in its Environment tab too.
4. **Confirm the predicted URLs match reality.** `render.yaml` hardcodes `CLIENT_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SOCKET_URL` as `https://shatha-events-{web,api}.onrender.com` — Render appends a suffix instead if either name was already taken. If that happens: update `CLIENT_URL` on the API service, and update+**redeploy** the web service (its `NEXT_PUBLIC_*` vars are baked into the build, so a value-only change needs a rebuild, not just a restart) to match the actual assigned URLs.
5. **Run the seed script once**, if you want demo data on the deployed instance: Render dashboard → shatha-events-api → Shell → `pnpm --filter @app/api seed`.

**Free-tier caveats**: free web services spin down after inactivity (~30-60s cold start on the next request); local-disk uploads (`STORAGE_DRIVER=local`) don't persist across redeploys on Render's ephemeral filesystem — fine for a demo, switch to Cloudinary for anything that needs to last.
