# Charger discovery

Real EV-charger discovery for Explore: GPS or typed location → up to 20 provider stations sorted by straight-line distance within 10/20/30/50/100 km → Navigate page → Google Maps hand-off. Discovery and booking are separate: provider stations are never bookable.

## Flow

| Step | Client | Server (`/api/v1/discovery`) | Google |
| --- | --- | --- | --- |
| Type a place | 300 ms debounce, session token, abort + sequence guard | `POST /autocomplete` | Autocomplete (New) |
| Pick a place | — | `GET /locations/:placeId?sessionToken=` | Place Details (New), Essentials mask |
| Use my location | Geolocation (10 s timeout, 60 s max age, low power) | `POST /reverse-geocode` (label only, never blocks) | Geocoding API |
| Search | Query key = centre + radius | `POST /stations/search` `{lat,lng,radiusKm}` | Nearby Search (New) |
| Navigate page | `/stations/:id/navigate`, works after refresh | `GET /stations/:id` | Place Details (New) |

Coordinates travel in POST bodies, so access logs never contain them. The server never logs coordinates, queries or addresses.

## Search pipeline (`server/services/discovery/`)

1. Radius must be exactly 10, 20, 30, 50 or 100 (zod; anything else is `400 INVALID_REQUEST`, never clamped).
2. ≤ 50 km: one circle at exactly the selected radius, `rankPreference: DISTANCE`, `maxResultCount: 20`.
3. 100 km: a 50 km centre circle plus 8 circles of 50 km centred 75 km out at 45° steps. Every point within 100 km is inside at least one circle with ≥ 1 km slack (sampled at the equator, 28°N, 64°N, 78°N, 88°N, 80°S and both sides of the date line in `tests/discovery-coverage.test.ts`).
   - If the centre circle alone proves the 20 nearest (saturated, ≥ 20 valid, nothing hidden), the ring is skipped: 1 request.
   - Otherwise the ring runs with concurrency 4: 9 requests in total. That is the hard cap.
4. Drop records without an ID or valid coordinates. Drop `CLOSED_PERMANENTLY`. Keep and flag `CLOSED_TEMPORARILY` and `FUTURE_OPENING`. Dedupe by place ID.
5. Compute the WGS84 geodesic distance (Vincenty) from the original centre, then filter `distance ≤ radius` on unrounded metres.
6. Sort by distance, then place ID. Cap at 20.
7. Status:
   - `ok`, `empty`, or `partial` (a ring circle failed).
   - A failed centre circle is an error, never "no chargers".
   - `coverage.mayOmitCloserStations` is set when a saturated or failed circle could hide stations closer than the 20th result.

Limits:
- Per-attempt timeout 5 s.
- One retry, with jitter, for 429/5xx/network errors.
- Overall budget 9 s, which stays under the serverless timeout.
- Per-IP rate limits: search 30/min, autocomplete 90/min, details 60/min, reverse geocode 20/min. These are per instance; add an edge or firewall limit before scaling out.

Error codes: `INVALID_REQUEST`, `RATE_LIMITED`, `NOT_FOUND`, `PROVIDER_TIMEOUT`, `PROVIDER_QUOTA`, `PROVIDER_CONFIG`, `PROVIDER_UNAVAILABLE`.

## Data honesty

- Unknown values are `null`. Price is always `{ known: false }`.
- Missing `availableCount` means availability is unknown, not available.
- Connector current (AC/DC) is set only where the standard defines it.
- No ETA is shown: there is no routing service. Distances are labelled "~" and described as approximate straight-line distances.
- "Available now" is opt-in (`?available=1`). Most provider listings publish no live availability.
- Booking:
  - `booking.bookable` is `false` for every provider station. There is no verified mapping to GoEvee inventory.
  - `POST /bookings` rejects any `chargerId` that is not in the `chargers` table (`server/services/booking-guard.ts`).
- No station is ever matched to inventory by name.

## Google terms followed

- Only place IDs may be stored indefinitely. Places content is not persisted on the device; the old `localStorage` station snapshot is gone.
- Only the chosen place (label + coordinates) is kept, in `sessionStorage`. The device position is held in memory only.
- Places results are drawn only on a Google map (Navigate page). The home preview is an illustration and plots no provider stations.
- Text attribution "Google Maps" sits under the results and in autocomplete. Third-party `attributions` are shown on the Navigate page.

## Setup

Server (`server/.env` or Vercel project env):

```
GOOGLE_PLACES_API_KEY=   # server-only; falls back to GOOGLE_MAPS_API_KEY
GOOGLE_PLACES_EV_FIELDS=on   # 'off' = no connector data, cheaper SKU
```

Google Cloud setup:
- Server key: enable Places API (New) and Geocoding API. Restrict the key to those APIs.
- Browser key (`VITE_GOOGLE_MAPS_API_KEY`): only draws the Navigate map. Restrict it to the Maps JavaScript API and to the HTTP referrers `https://www.goevee.in/*` and `https://goevee.in/*`.

Billing per Google's SKU tables:
- A list request with `evChargeOptions` is billed as Nearby Search Enterprise + Atmosphere. With `GOOGLE_PLACES_EV_FIELDS=off` it is billed as Pro.
- A 100 km search costs 1–9 such requests.
- Station details are billed at the same tier as the list.
- Location resolve uses Place Details Essentials and closes the Autocomplete session.

## Tests

- `npx tsx --test tests/*.test.ts` covers geodesy, coverage, the pipeline, provider/HTTP contracts, the adapter and the booking guard.
- `npx playwright test` runs the browser journeys against stubbed `/api/v1/discovery` (`tests/browser/helpers/discovery.ts`).
