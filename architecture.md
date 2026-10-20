# GoEvee — Architecture

> Author's framing: this document describes the system **as it is built today**, grounded in the
> actual source tree, and then marks—explicitly—where the current design will bend under load and
> what the next increments should be. Nothing here is aspirational unless it is in a section titled
> "Evolution" or "Known limitations." Claims about scale are reasoned, not measured; the system has
> not yet been load-tested.

---

## 1. What GoEvee is

GoEvee (goevee.in) is a single-app EV-charging aggregator for India: it brings chargers from
multiple networks into one place so a driver sees availability, pricing, and connector fit without
juggling per-network apps. The product promise — "find a charger you can trust" — drives one
non-obvious architectural constraint that recurs throughout this document: **the system must never
present data it cannot stand behind.** Freshness, availability, and price are allowed to be
"unknown"; they are never allowed to be fabricated. That constraint shapes the data model, the
ingestion pipeline, and the discovery read path.

---

## 2. Architecture at a glance

```
                         ┌───────────────────────────────────────────────┐
                         │                   Client (SPA)                 │
                         │  Vite + React 18 + React Router (BrowserRouter) │
                         │  TanStack Query · Tailwind v3 · shadcn/Radix    │
                         └───────────────┬───────────────────────────────┘
                                         │ HTTPS
          ┌──────────────────────────────┼───────────────────────────────────────┐
          │ Static edge (Vercel CDN)      │ /api/*  (rewrite)                      │
          │  dist/ prebuilt HTML+assets   │                                        │
          │  per-route index.html (SEO)   ▼                                        │
          │                         ┌───────────────────────┐                     │
          │                         │  Serverless function  │  api/index.ts       │
          │                         │  Express app (one fn) │  → server/app.ts    │
          │                         └───────────┬───────────┘                     │
          └─────────────────────────────────────┼─────────────────────────────────┘
                                                 │
            ┌────────────────────────────────────┼───────────────────────────────┐
            │ Request pipeline (Express middleware, in order)                      │
            │  trust proxy → security headers/HSTS → in-mem rate limit → CORS      │
            │  → json(16kb) → /api/v1 router → controller → service → repository   │
            │  → Drizzle → Postgres                                                │
            └────────────────────────────────────┬───────────────────────────────┘
                                                 │
             ┌───────────────────────┐   ┌────────▼─────────┐   ┌──────────────────┐
             │ Google Maps Platform  │   │  PostgreSQL      │   │ Cloudflare        │
             │  Places API (New),    │   │  (Neon, managed) │   │ Turnstile         │
             │  Maps JS, Geocoding   │   │  Drizzle ORM     │   │ (bot verify)      │
             │  — called FROM the    │   │  node-postgres   │   └──────────────────┘
             │    browser, not server│   │  Pool            │
             └───────────────────────┘   └────────┬─────────┘
                                                  │ nightly (local/long-running host only)
                                         ┌─────────▼──────────┐
                                         │ Ingestion cron 02:00 │
                                         │ adapters: OCM, Delhi │  → upsert stations+chargers
                                         └──────────────────────┘
```

Two things in this picture are worth stating plainly because they are easy to get wrong:

1. **There are two independent sources of station data.** Discovery on the client calls **Google
   Places (New) directly from the browser** (`src/services/googleMapsService.ts`), while the
   **backend owns a first-party catalog** in Postgres populated by the nightly ingestion job and by
   operator CRUD. They are not yet unified; see §7 and §11.
2. **The backend is a single Express app deployed as one serverless function.** `api/index.ts` is a
   three-line re-export of `server/app.ts`; Vercel rewrites every `/api/*` path to it. The same app
   object runs as a normal long-lived `app.listen` server in local/non-Vercel environments
   (`server/index.ts`). This dual-target design is deliberate and has sharp edges (§8).

---

## 3. Technology choices and why they fit

| Layer | Choice | Why it fits (and the tradeoff) |
|---|---|---|
| Client | Vite 5 + React 18 SPA, React Router `BrowserRouter` | Fast dev + small, cache-busted bundles. Not Next.js — so SSR is faked at build time by emitting per-route `index.html` for SEO/meta (`scripts/generate-site.ts`). Tradeoff: no server rendering of dynamic data; first paint is static shell + hydration. |
| Server data on client | TanStack Query | Caching, dedupe, retry, and a natural "stale snapshot" story for offline. Tradeoff: cache keys must encode every input (origin + radius) or you get stale reads. |
| API | Express 4 as one Vercel function | Minimal, familiar, portable; the same code runs locally and serverless. Tradeoff: no per-route cold-start isolation; in-process state (rate limiter, DB pool) does not survive across instances. |
| ORM/DB | Drizzle ORM + PostgreSQL (Neon) | Typed SQL without a heavy abstraction; Postgres gives transactions and `FOR UPDATE` row locks the booking engine depends on. Neon gives managed, serverless-friendly Postgres. Tradeoff: node-postgres `Pool` in a serverless function wants a pooled/serverless driver at scale (§8). |
| Auth | Custom JWT (`jsonwebtoken`) + `bcrypt` | No external IdP dependency; stateless verification suits serverless. Tradeoff: stateless means no server-side revocation; the token lives in the browser (§9). |
| Validation | Zod, shared between client and server (`shared/validation.ts`) | One schema, two consumers — the signup rules can't drift between UI and API. |
| Bot defense | Cloudflare Turnstile (server-verified) + honeypot | Cross-instance bot checks that a per-instance rate limiter can't do. |
| Maps/discovery | Google Maps Platform (Places API New) | Nationwide coverage without first-party crawling. Tradeoff: Google returns no tariff, no opening hours, and live availability only for some networks — the trust constraint forces honest "unknown" handling. |

---

## 4. The client

A conventional React SPA with a deliberate layering (model / controller / view) visible in
`src/`:

- **`models/`** — pure domain types and logic (`station.model.ts`, `booking.model.ts`,
  `search.model.ts`). No React, no I/O. These are the ground truth types.
- **`services/`** — I/O boundaries: `apiClient.ts` (fetch + JWT bearer), `authService.ts`,
  `bookingService.ts`, `stationService.ts`, `googleMapsService.ts` (Places New), `analytics.ts`
  (GA4, consent-gated), `consent.ts` (DPDP-style consent record in `localStorage`).
- **`controllers/`** — React context + hooks that orchestrate state: `useAuth`, `useBookings`,
  `useStations`, `useSearchController`, `useGoogleMapsLoader` (on-demand SDK loader),
  `useExplore` (the home screen's state machine: origin, URL-synced filters, sort, stable result
  membership, offline snapshot).
- **`views/` and `pages/` and `components/`** — presentation. The redesigned Explore surface
  (`components/explore/*`, `components/shell/*`) is token-driven (`styles/goevee.css`) and keeps the
  Google Maps SDK **off the critical path**: the home map is a lightweight inline SVG preview; the
  full interactive map lives at `/ev-charger-station`.

Two client decisions that matter architecturally:

- **The Maps SDK is loaded lazily, by the browser, only when needed** (`useGoogleMapsLoader`
  injects the script tag on demand). This keeps first paint cheap and means a dead/expired key
  degrades one feature instead of blocking the app. It also means **Google billing is driven by
  client traffic**, which is a cost-control and key-restriction concern, not a server one.
- **Consent and analytics are strictly gated.** Analytics stays off without a GA4 id *and* explicit
  consent. The consent choice is persisted and re-applied before any tracking fires.

---

## 5. The server

A clean, testable, four-layer Express app. Every layer has one job:

```
routes/        thin HTTP wiring + middleware mounting (v1.ts fans out to auth/users/stations/chargers/bookings)
controllers/   request/response adapters (parse → call service → shape response); wrapped in asyncHandler
services/      business rules (auth.service, booking.service, station.service, IngestionService, …)
repositories/  all database access via Drizzle (booking/charger/station/user)
db/            schema.ts (source of truth), index.ts (pool + drizzle), migrations/
middlewares/   auth (JWT), security (headers/HSTS/rate limit), botProtection (Turnstile), validate (Zod), error
validators/    Zod request schemas (+ shared/validation.ts for signup)
```

The **request pipeline** (`server/app.ts`) is ordered intentionally:

1. `trust proxy` set to a bounded hop count (`TRUST_PROXY_HOPS`, validated 0–5) so client IPs are
   correct behind Vercel without being spoofable.
2. Security headers on every response — `nosniff`, `DENY` framing, strict referrer, a locked-down
   `Permissions-Policy` (only `geolocation=(self)`), a deny-all CSP for API responses, and
   `no-store`. In production, non-HTTPS GETs 308-redirect to the canonical origin and writes get
   `426`.
3. A small **in-memory rate limiter** (120 req/min/IP) as a backstop. It is explicitly a
   per-instance safeguard, not a distributed limiter (§8).
4. CORS locked to an allow-list derived from environment.
5. `express.json({ limit: '16kb' })` — bodies are tiny; this caps abuse.
6. The `/api/v1` router; then `notFound` and a central `errorHandler` that maps `AppError`,
   body-parser `413`/`400`, and unknown `500`s to safe JSON (stack only in non-production).

Errors use a single `AppError(statusCode, message)` type, thrown in services and translated once at
the edge. Controllers never format errors themselves.

---

## 6. The booking engine — the most load-bearing piece

Reserving a charger is where correctness actually matters, and the design reflects it
(`repositories/booking.repository.ts` → `createBookingWithSafety`). The invariant: **no two active
reservations may overlap on the same first-party charger, including a safety buffer on both sides.**

How it is enforced:

- The write runs inside a **Postgres transaction**.
- It `SELECT … FOR UPDATE` the charger row first, taking a **row-level lock** so concurrent bookings
  for the same charger serialize instead of racing.
- It rejects out-of-service / maintenance chargers.
- It computes a **buffered window** (`BOOKING_BUFFER_MINUTES`, default 15) and checks for any
  `PENDING | CONFIRMED | ACTIVE` booking that overlaps `[start-buffer, end+buffer)` using the
  half-open overlap test `existing.start < bufferedEnd AND existing.end > bufferedStart`.
- On success it inserts the booking and advances the charger's `estimatedAvailableAt`.

This is a solid single-node correctness story. Its **known limitation** is explicit in the code and
the context report: the overlap guard only fires when the charger exists in the first-party DB.
Bookings against **Google Place IDs** (chargers discovered via Places, not in our catalog) skip the
lock and the overlap check entirely — `bookings.chargerId` deliberately has no FK so it can hold a
Google id. There is also **no database-level exclusion constraint** as a second line of defense.
Under concurrency against external-id chargers, double-booking is possible. See §11.

---

## 7. Data: the catalog, discovery, and the two-source split

**Schema** (`server/db/schema.ts`, Postgres via Drizzle):
`users` (role enum USER/OPERATOR/ADMIN) · `vehicles` · `stations` (lat/lng as numeric, status enum,
jsonb pricing/amenities) · `chargers` (connector, kW, status enum, `estimatedAvailableAt`) ·
`bookings` · `charging_sessions` · `favorites` · `reviews`. Indexes exist on the hot paths: station
location `(latitude, longitude)`, charger `(stationId)` and unique `(stationId, chargerCode)`,
booking `(chargerId, startTime, endTime)` and unique `bookingReference`.

**Geospatial read** (`station.repository.listNearbyStations`): a **haversine distance computed in
SQL** (`6371 * acos(…)` with `least/greatest` clamping to avoid domain errors), filtered by radius
and ordered by distance, then chargers batch-loaded with one `IN` query. This is correct and
dependency-free, but it is a **full-scan haversine** — it cannot use the plain B-tree lat/lng index
as a true spatial index. It is fine for a modest catalog; it is the first thing to replace with
PostGIS/geohashing when the catalog grows (§11).

**The two-source reality.** Today the home/discovery experience reads from **Google Places (New)**
directly in the browser, returning stations with live availability *where networks publish it*,
plus rating and address, but **no price (placeholder), no opening hours, and no stable per-connector
freshness.** Meanwhile the **first-party catalog** (DB) is filled by:

- **Operator CRUD** through the authenticated API, and
- a **nightly ingestion cron** (`cron.ts` at 02:00) that runs an **adapter pipeline**
  (`IngestionService` + `BaseAdapter` subclasses `OcmAdapter`, `DelhiAdapter`). Each adapter
  fetches a source, normalizes to `{ station, chargers }`, and the service upserts them.

These two worlds are not merged yet. The adapter pattern is the right seam for unifying them: the
long-term design is that **Google becomes one more adapter (or a cache-through source) behind a
single first-party read model**, so discovery, trust metadata, and booking all speak to one catalog.
That is the central architectural evolution ahead (§11).

---

## 8. Deployment and the serverless edge-cases

- **Static**: `vite build` + `scripts/generate-site.ts` emit `dist/` with a per-route `index.html`
  (so each route has correct title/description/canonical for crawlers) plus `sitemap.xml`,
  `robots.txt`, and a prerendered first frame of the home screen for fast LCP. Served from Vercel's
  CDN.
- **API**: `vercel.json` rewrites `/api/*` and `/health` to the single function; everything else
  falls through to the SPA shell. `installCommand`/`buildCommand` are pinned; a `check:secrets`
  step scans the bundle so no private value ships to the browser.
- **The serverless caveats that will bite at scale, and are known:**
  - The **in-memory rate limiter** and its `Map` live per function instance. Across many warm
    instances, the effective limit is `120 × instances`. It is a backstop, not a control — the
    comment in `security.ts` says exactly this and points to the hosting firewall / Turnstile for
    real limits.
  - The **node-postgres `Pool`** is created per instance. Many concurrent serverless instances each
    holding a pool can exhaust Postgres connections. Neon's pooled endpoint / a serverless driver is
    the mitigation; today it is a single `Pool` to a connection string.
  - The **cron** only starts under `app.listen` (non-production, non-Vercel). On Vercel the nightly
    ingestion does **not** run from this code path — it needs Vercel Cron (or an external scheduler)
    wired to an ingestion endpoint. This is a deployment gap, not a code bug.

---

## 9. Security posture

Strong fundamentals, with a few documented sharp edges:

- **Transport**: HSTS in production, forced HTTPS, strict headers, locked `Permissions-Policy`,
  deny-all CSP on API responses. The static app ships its own CSP via Vercel headers, including a
  hash for the one inline theme script (no `unsafe-inline`).
- **Input**: Zod validation at the edge, 16 KB body cap, shared signup schema so client and server
  agree.
- **Bots**: Turnstile verified server-side (checks success, action, and hostname allow-list) with a
  honeypot field; auth-type routes can require it.
- **AuthZ**: role-gated middleware (`requireRole`) and ownership checks in services
  (`canManageStation`, booking ownership).
- **Known risks (from the audit, to fix):** JWT is stored in the browser and is stateless (no
  revocation); historically a weak/committed JWT secret existed in git history (config now *rejects*
  a <32-char secret in production, which closes the door going forward); self-registration as
  OPERATOR is possible; and discovery renders Google-supplied strings into map InfoWindows (XSS
  surface) — the code escapes them, which must stay true. These are tracked in §11.

---

## 10. Observability, config, and testing

- **Config** is centralized (`server/config/index.ts`) with fail-fast guards: invalid proxy hops or
  a short production JWT secret throw at boot. Browser-visible env is allow-listed and verified at
  build (`vite.config.ts` throws on an unapproved `VITE_` var).
- **Testing** present today: pure unit tests for domain logic (Explore filters/format/geo), a
  Playwright suite covering public pages, consent, accessibility (axe, multiple widths), and the
  Explore acceptance criteria, plus a security test. There is **no server-side integration test** of
  the booking transaction yet — the highest-value gap given §6.
- **Observability** is currently `console.*` logging. There is no structured logging, request id,
  metrics, or tracing. This is the second-most-important platform gap after unified data (§11).

---

## 11. Known limitations and evolution (prioritized)

1. **Double-booking on external-id chargers.** Add a DB exclusion constraint
   (`EXCLUDE USING gist (charger_id WITH =, tstzrange(start,end) WITH &&)`) as defense-in-depth, and
   bring external chargers into the first-party catalog so the `FOR UPDATE` lock applies. *Highest
   correctness priority.*
2. **Unify the two data sources.** Make Google a cache-through adapter behind the first-party read
   model so discovery, trust metadata, and booking share one catalog and one freshness story.
3. **Geospatial scaling.** Replace SQL haversine with PostGIS (`geography` + GiST index) or a
   geohash prefix index once the catalog outgrows a full scan.
4. **Serverless data layer.** Move to Neon's pooled endpoint / a serverless Postgres driver; make
   the rate limiter distributed (edge/WAF or a shared store).
5. **Scheduled ingestion in production.** Wire Vercel Cron (or external scheduler) to an ingestion
   endpoint; make adapter upserts idempotent (true upsert on a natural key) rather than insert-only.
6. **Auth hardening.** Short-lived access tokens + refresh with server-side revocation; restrict
   OPERATOR elevation to an approval flow.
7. **Observability.** Structured logs with request ids, basic RED metrics on the booking and
   discovery paths, and error tracking.
8. **Realtime availability.** The client already models a live-status transport (SSE/WebSocket with
   polling fallback) and an honest freshness ladder; the server side (a push channel fed by OCPI-style
   operator feeds) is the long-term build.

---

## 12. One-paragraph summary

GoEvee is a React SPA on Vercel's CDN talking to a single Express serverless function backed by
Postgres (Neon) through Drizzle, with a clean routes→controllers→services→repositories spine. Its
distinctive, correct ideas are a transactional, row-locked, buffer-aware booking engine and a
"never fabricate data" trust model that permeates discovery. Its honest, known weak points — all
documented in-repo — are the external-id booking gap, two unmerged station sources, SQL-haversine
geo at scale, serverless pool/limiter semantics, and production scheduling + observability. The
adapter pattern and the model/controller/view split give the system clean seams to evolve along the
roadmap in §11 without a rewrite.
