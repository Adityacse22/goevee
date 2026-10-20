# GoEvee — System Design

> Scope: this is a system-design document for GoEvee as implemented, written the way a design review
> is run — requirements first, then the model, the contracts, the critical flows, the scale
> reasoning, and the tradeoffs. Where a number is an estimate it is labeled an estimate; the system
> has not been load-tested, so capacity figures are reasoned targets, not measurements.

---

## 1. Problem statement and goals

**Problem.** Indian EV drivers juggle a different app per charging network to answer three
questions: *Is there a charger near me? Can my car use it? Is it free right now?* GoEvee answers all
three in one place and lets the driver reserve a slot.

**Functional goals**
- Discover chargers near a location (the user's real position or a searched place).
- Show connector fit, power, availability, and price *when known* — and say "unknown" when not.
- Let a signed-in user reserve a time slot on a charger without conflicts.
- Let operators list and manage their stations and chargers; let admins oversee.
- Aggregate third-party catalogs (OCM, city datasets) into a first-party store.

**Non-functional goals**
- **Trust:** never present fabricated availability, price, or freshness. This is a hard constraint,
  not a nicety.
- **Fast on a mid-range Android over patchy 4G:** small critical-path bundle, no heavy map SDK on
  first paint, static-served shell.
- **Correct under concurrency:** two users cannot reserve the same charger for overlapping windows.
- **Private by default:** location is used only on explicit action; analytics only on consent
  (DPDP-aligned).
- **Cheap to operate early:** serverless, managed Postgres, pay-per-use maps.

**Explicit non-goals (today)**
- Payments / settlement. Real-time charging telemetry (OCPI session streaming). Native apps.
  Multi-region active-active. These are future increments, not current scope.

---

## 2. Requirements, sharpened

| # | Requirement | Measure of done |
|---|---|---|
| R1 | Nearby discovery centered on real location | List + preview reflect the resolved origin; projection is from real lat/lng |
| R2 | Honest data | Unknown price hidden; unknown hours → "Hours unavailable"; freshness ladder Live → "Updated N min" → "Status unavailable" |
| R3 | Conflict-free booking on first-party chargers | Overlapping windows (± buffer) rejected under concurrency |
| R4 | Role-based management | USER books; OPERATOR manages own stations/chargers; ADMIN manages all |
| R5 | Catalog ingestion | Nightly adapters normalize + persist external sources |
| R6 | Performance budget | No Maps SDK on first paint; static shell; per-route SEO HTML |
| R7 | Privacy & bot resistance | Consent-gated analytics; Turnstile-verified auth; no secrets in bundle |

---

## 3. Scale assumptions and capacity reasoning (estimates)

These are design targets to pressure-test the architecture, not current traffic.

- **Audience sizing (year-1 estimate):** ~100k registered users, ~5k daily active, peak ~50 req/s
  of API traffic concentrated on discovery and booking reads, with booking *writes* far rarer
  (single-digit req/s at peak).
- **Read/write ratio:** heavily read-skewed. Discovery dominates; it currently runs on the client
  against Google, so it is **not** server load today. Server load is auth, booking, profile, and
  operator CRUD.
- **Data volume:** stations in the tens of thousands at national coverage; chargers a small multiple
  of that; bookings growing linearly with DAU. All comfortably within a single Postgres instance for
  the foreseeable horizon.
- **Implication:** the bottleneck is **not** raw data size — it is (a) **booking write contention**
  per charger, and (b) **serverless connection fan-out** to Postgres, and (c) **Google Maps cost +
  the two-source split**, in that order. The design sections below target those three.

A back-of-envelope on booking contention: contention is *per charger*, not global. Even at national
scale, concurrent reservation attempts on the *same* charger in the *same* buffered window are rare,
so the row-lock serialize-per-charger approach (§6) scales horizontally across chargers without a
global lock. The risk is correctness (external-id gap), not throughput.

---

## 4. High-level design

```
Client SPA ──HTTPS──> Vercel edge ──static──> dist/ (CDN)
     │                       └── /api/* rewrite ──> Express serverless fn
     │                                                   │
     ├── Google Places (New), Maps JS  (browser → Google, discovery)
     │
     └── API ─> controllers ─> services ─> repositories ─> Drizzle ─> Postgres (Neon)
                                   │
                                   └── IngestionService (adapters) ← nightly scheduler
```

Design stance: **thin stateless API, fat typed domain, single source of transactional truth
(Postgres).** Discovery is pushed to the client/Google to keep the server stateless and cheap; the
server owns the things that *must* be consistent (identity, bookings, the first-party catalog).

---

## 5. API contract (v1)

Base path `/api/v1`. JSON only, 16 KB request cap, bearer-JWT auth where noted. All errors return
`{ "error": string }` with an appropriate status; `AppError` carries the status from the service.

**Auth** (`/auth`) — rate-limited 10 / 15 min, Turnstile-protected in production
- `POST /auth/register` — Zod `registerSchema` + honeypot + Turnstile(action=register) → `{ user, token }`
- `POST /auth/login` — `loginSchema` + Turnstile(action=login) → `{ user, token }`
- `GET  /auth/me` — bearer → current user

**Users** (`/users`, all authenticated)
- `GET  /users/profile` · `PATCH /users/profile`
- `POST /users/vehicles` · `GET /users/bookings` · `GET /users/favorites`

**Stations** (`/stations`)
- `GET  /stations` — public list
- `GET  /stations/nearby?lat&lng&radiusKm` — public haversine search (first-party catalog)
- `GET  /stations/:stationId` — public, with chargers
- `POST /stations` — OPERATOR/ADMIN
- `PATCH /stations/:stationId` — OPERATOR(own)/ADMIN

**Chargers**
- `POST /chargers` — OPERATOR/ADMIN
- `GET  /chargers/:chargerId`
- `PATCH /chargers/:chargerId/status` — OPERATOR/ADMIN
- `GET  /stations/:stationId/chargers`

**Bookings** (`/bookings`, all authenticated)
- `POST /bookings` — create with safety (transaction + lock + overlap)
- `GET  /bookings/me` — my bookings
- `GET  /bookings/:bookingId` — owner or ADMIN
- `PATCH /bookings/:bookingId/cancel` — owner or ADMIN

Every mutating route is `validate(zodSchema)` → `asyncHandler(controller)` so bad input is rejected
before the service runs and async errors reach the central handler.

---

## 6. Deep dive: the booking write path (the system's crux)

**Goal invariant:** for any first-party charger, the set of `PENDING|CONFIRMED|ACTIVE` bookings has
no two intervals that overlap once each is padded by `BOOKING_BUFFER_MINUTES` on both sides.

**Sequence** (`POST /bookings` → `booking.service.createBooking` → `createBookingWithSafety`):

1. Validate times (valid ISO, `start < end`).
2. Open a **transaction**.
3. `SELECT … FROM chargers WHERE id = ? FOR UPDATE` — acquire a **row lock**. Concurrent requests
   for the *same* charger now queue; different chargers proceed in parallel.
4. If the charger is first-party: reject `OUT_OF_SERVICE|MAINTENANCE`; then run the overlap query
   `start < bufferedEnd AND end > bufferedStart` over active statuses; reject on hit (409).
5. Insert the booking (`CONFIRMED`, generated `bookingReference`), advance `estimatedAvailableAt`.
6. Commit.

**Why this is correct on first-party chargers:** the `FOR UPDATE` lock makes the check-then-insert
atomic per charger, so the classic read-modify-write race cannot interleave two conflicting inserts.

**Where it is not yet correct (designed-in gap, tracked):** if `chargerId` is a **Google Place ID**
(no row in `chargers`), step 3 locks nothing and step 4 is skipped — the booking inserts
unconditionally. `bookings.chargerId` intentionally has no FK to allow this. There is also **no
Postgres exclusion constraint** as a backstop. **Fix:** add
`EXCLUDE USING gist (charger_id WITH =, tstzrange(start_time, end_time) WITH &&)` for defense in
depth, and bring external chargers into the catalog so the lock path applies. This is the top
correctness item on the roadmap.

---

## 7. Deep dive: discovery and the honest-data model

**Client flow (home / Explore):**
1. First paint is a static shell with a lightweight **SVG map preview** — no Maps SDK yet (R6).
2. The user either accepts the default area or taps "Use current location" (consent-first
   geolocation; never auto-prompted — R7).
3. Only after first paint, once the origin is resolved and the preview enters the viewport, the app
   lazily loads the Maps SDK and calls **Places API (New) `Place.searchNearby`** for real stations.
4. Results are adapted into the client's `Station` model; the preview projects each real `lat/lng`
   via equirectangular projection around the origin (far ones clamp to the edge); the full
   interactive map opens on tap at `/ev-charger-station`, carrying origin + filters.

**The honest-data rules (R2), enforced in the adapter + card layer:**
- **Price:** Google returns no tariff → price is hidden, and the "Under ₹15/kWh" filter chip is
  removed so no one filters on a fabricated number.
- **Hours:** unknown → "Hours unavailable".
- **Freshness:** "Live" only when the source actually publishes live availability and it is fresh;
  otherwise "Updated N min ago"; otherwise "Status unavailable". The client even models a future
  realtime transport (SSE/WebSocket with polling fallback) but will not label stale data as live.

**Server flow (`/stations/nearby`)** is the first-party counterpart: SQL haversine over the catalog,
radius-filtered, distance-ordered, chargers batch-loaded. Same honesty rules apply because the
catalog carries real operator-provided fields.

---

## 8. Deep dive: ingestion pipeline

`IngestionService` runs a list of `BaseAdapter` subclasses (`OcmAdapter`, `DelhiAdapter`). The base
class defines a tiny, testable contract: `fetchStations()` → raw, `normalizeStation(raw)` →
`{ station, chargers } | null`, and `process()` runs fetch → normalize → collect. The service then
persists each normalized station and its chargers.

**Strengths:** adding a new source is a new adapter, nothing else changes; normalization is isolated
and unit-testable; a single bad record is caught per-item without failing the batch.

**Gaps to close (R5):** persistence is currently insert-oriented, so repeated runs can duplicate —
it needs a true **idempotent upsert on a natural key** (source + external id). And the cron only
starts under `app.listen`, so on Vercel it must be triggered by **Vercel Cron / external scheduler**
hitting an ingestion endpoint. The long-term move is to make **Google a cache-through adapter** so
discovery and the catalog converge on one read model.

---

## 9. Data model (essentials)

```
users(id, full_name, email[unique], password_hash, role{USER|OPERATOR|ADMIN}, phone, ts)
vehicles(id, user_id→users, name, brand, model, connector_type, battery_capacity)
stations(id, operator_id→users?, name, address, city/state/country/pincode,
         latitude, longitude, status{ACTIVE|INACTIVE|PENDING_APPROVAL|SUSPENDED},
         opening_time?, closing_time?, pricing_details jsonb, amenities jsonb)   idx(lat,lng)
chargers(id, station_id→stations, charger_code, connector_type, power_output_kw,
         current_type?, status{AVAILABLE|OCCUPIED|RESERVED|OUT_OF_SERVICE|MAINTENANCE},
         estimated_available_at?)   unique(station_id, charger_code)
bookings(id, user_id→users, charger_id[NO FK — may hold a Google place id],
         vehicle_id→vehicles?, start_time, end_time,
         status{PENDING|CONFIRMED|ACTIVE|COMPLETED|CANCELLED|EXPIRED},
         total_price?, booking_reference[unique])   idx(charger_id, start_time, end_time)
charging_sessions(id, booking_id?, charger_id→chargers, actual_start/end, energy_kwh, status)
favorites(id, user_id, station_id)  unique(user_id, station_id)
reviews(id, user_id, station_id, rating, comment)
```

Modeling notes: lat/lng are `numeric` (precise, but no spatial index — see §11); pricing/amenities
are `jsonb` for operator flexibility; the deliberate missing FK on `bookings.charger_id` is what
enables Google-id bookings and is the direct cause of the §6 gap.

---

## 10. Cross-cutting concerns

- **Security:** HSTS/forced HTTPS, strict headers, deny-all CSP on API, 16 KB bodies, Zod at the
  edge, role gates + ownership checks, Turnstile + honeypot, build-time secret scan, fail-fast
  config (short prod JWT secret throws). Residual risks tracked: browser-stored stateless JWT (no
  revocation), OPERATOR self-registration, InfoWindow XSS surface (must stay escaped).
- **Privacy:** geolocation only on action; analytics only with GA4 id + consent; consent persisted
  and re-applied.
- **Config:** centralized with guards; browser env allow-listed and verified at build.
- **Testing:** client unit (filters/format/geo) + Playwright (public pages, consent, a11y, Explore
  criteria) + a security test. **Gap:** no server integration test of the booking transaction —
  highest-value test to add given §6.
- **Observability:** `console.*` only today; needs structured logs + request ids + RED metrics on
  booking/discovery + error tracking.

---

## 11. Bottlenecks and scaling plan (prioritized)

1. **Booking correctness on external ids** — exclusion constraint + fold external chargers into the
   catalog. *(correctness, do first)*
2. **Serverless → Postgres fan-out** — each warm function holds a `pg.Pool`; many instances can
   exhaust connections. Move to **Neon pooled endpoint / serverless driver**; cap pool size per
   instance.
3. **Rate limiting is per-instance** — effective limit scales with instance count. Move to an
   **edge/WAF limiter or shared store**; keep Turnstile for bot checks.
4. **SQL haversine is a full scan** — fine now, replace with **PostGIS GiST (geography)** or geohash
   prefix index at catalog scale.
5. **Two unmerged data sources + Google cost** — unify via cache-through adapter; add server-side
   caching of discovery to cut per-browser Google calls and bound cost.
6. **Ingestion** — idempotent upserts + production scheduling.
7. **Scheduled/background work generally** — serverless has no durable in-process scheduler; move
   crons to the platform scheduler and long jobs to a queue/worker when they appear.

---

## 12. Alternatives considered (and why the current choice stands for now)

| Decision | Chosen | Alternative | Why current choice holds early |
|---|---|---|---|
| Rendering | Vite SPA + prebuilt per-route HTML | Next.js SSR | SPA keeps the critical bundle tiny and hosting trivial; build-time HTML covers SEO. Revisit if dynamic SSR/ISR becomes necessary. |
| Backend shape | One Express fn | Split microservices | A monolith with clean layers is faster to build and reason about at this scale; the service seams already exist if a split is ever needed. |
| Discovery source | Client → Google Places | Server-side crawl + own index | Instant national coverage, zero crawl ops, server stays stateless. Tradeoff is cost + the two-source split, addressed by the cache-through plan. |
| Booking safety | Tx + `FOR UPDATE` + overlap query | DB exclusion constraint only, or app-level lock | Row lock is simple and correct for first-party rows; the plan *adds* the exclusion constraint as defense-in-depth rather than replacing the lock. |
| Geo query | SQL haversine | PostGIS from day one | No extension dependency, correct, good enough for a small catalog; PostGIS is the clean upgrade path. |
| Auth | Custom JWT | Managed IdP (Auth0/Cognito) | No external dependency/cost, stateless verification suits serverless; the cost is revocation/rotation, which the roadmap addresses with refresh tokens. |

---

## 13. Summary

GoEvee's system design is a pragmatic, correct early-stage architecture: a cheap stateless API and a
static client in front of a single consistent Postgres, with the one truly hard problem — conflict-
free booking — solved properly for first-party chargers via transactional row locking, and the one
truly hard product constraint — never lie about data — solved by an honest "unknown" model across
discovery. The design's weak points are known, localized, and have clean upgrade paths that follow
the existing seams (adapters, layered services, the model/controller/view split): close the
external-id booking gap, unify the two station sources, make the data layer serverless-safe, and add
real observability. None of these require a rewrite — which is the clearest sign the foundations are
right.
