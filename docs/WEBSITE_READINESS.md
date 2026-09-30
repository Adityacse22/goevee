# Website readiness — goevee.in

Implementation verified on 1 October 2026. Deployment is initiated by pushing the verified commit to the connected GitHub branch; the environment settings below are required for production services.

## Deployment settings needed

Vercel is explicitly configured to install with `npm ci`, build with `npm run build`, and publish `dist`, using the included `vercel.json` and `api/index.ts`. This avoids selecting the repository’s older pnpm/Bun lockfiles. The existing production canonical domain is `https://www.goevee.in` (the apex redirects there).

- Set `VITE_API_BASE_URL=/api/v1` for the same-origin Vercel API. A separate API requires HTTPS and adding that exact origin to `connect-src` in the Content Security Policy.
- Set a **separate, restricted public** `VITE_GOOGLE_MAPS_API_KEY`. Google Maps JavaScript needs a browser-visible key. Restrict website referrers to `https://goevee.in/*` and `https://www.goevee.in/*`, and restrict APIs to the Maps JavaScript / Places / Geocoding features actually used. Use a different development key for localhost. Do not reuse a server credential.
- A hardcoded Maps key was removed from `test_places.py`. Restrict or rotate that previously exposed key in Google Cloud; removal from the current source does not remove it from Git history or past deployments. No cloud credentials were changed during this work.
- Keep `DATABASE_URL`, `JWT_ACCESS_SECRET` (at least 32 random characters), `GOOGLE_MAPS_API_KEY` for any server-side integrations, and `TURNSTILE_SECRET_KEY` **only in backend environment settings**, without a `VITE_` prefix. Local `.env` files are ignored by Git. Existing sign-in tokens remain in browser local storage; private infrastructure credentials must never go there.
- Set `NODE_ENV=production`, `APP_ORIGIN=https://www.goevee.in`, and `TRUST_PROXY_HOPS=1` on Vercel. For a directly exposed Node server use `0`; for another trusted reverse proxy match the real topology. Configure TLS at the proxy. Do not trust arbitrary forwarded headers.
- Create a Cloudflare Turnstile widget for `www.goevee.in` and `goevee.in`. Set the **public** `VITE_TURNSTILE_SITE_KEY` and **private** `TURNSTILE_SECRET_KEY`. Set `TURNSTILE_HOSTNAMES=www.goevee.in,goevee.in`. The frontend and backend must be deployed together. Production login and registration intentionally return 503 if bot verification is unconfigured. Tokens are verified server-side, with expected hostname/action and a timeout. Development without a secret bypasses Turnstile only; honeypots and rate limits remain active.
- For analytics, create/use a GA4 web property and set its public `VITE_GA_MEASUREMENT_ID=G-…`. **Disable Enhanced Measurement for this web stream** (especially browser-history pageviews and form interactions) to avoid duplicate views or collecting form/location data. Evee sends explicit public pageviews and the Find chargers click after consent. Advertising signals are disabled. No ID was supplied, so analytics is wired but not active in the final build. Verify consent and the GA4 Realtime report after adding a real ID; the local browser tests use a fake ID and intercept the Google script.
- The legal pages use **Evee** and **contact.goevee@gmail.com**, supplied by the owner. Review the wording against actual operator identity, hosting/database providers, retention practices and booking/refund arrangements before publication. No registered entity, address, response deadline, refund promise or certification has been invented.

## Changes covering the twenty requests

| Request | Implementation |
| --- | --- |
| Privacy | `/privacy`, using current account, location, booking and provider data flows. |
| Terms | `/terms`, including account eligibility, station information, bookings and acceptable use. |
| Secrets | Removed tracked test credential; public env allowlist; source and production-asset scans; server import guard; ignored local secrets. Cloud key restriction/rotation remains an owner action. |
| HTTPS | Verified live HTTP → HTTPS redirect. Added Vercel redirect/HSTS and API HTTPS enforcement with a fixed redirect origin, plus security headers. |
| Cookie consent | Equal reject/accept controls, versioned 180-day preference, footer settings, cross-tab updates, withdrawal and analytics-cookie cleanup. |
| Metadata | Route titles/descriptions, canonical URLs, Open Graph and Twitter tags; build-generated HTML heads for direct/crawler requests, not only client navigation. Private and unknown routes use noindex. |
| Social preview | Original 1200 × 630 Evee SVG artwork and PNG export, with alt text in metadata. |
| Favicon | Matching SVG, PNG, ICO, Apple touch icon and web manifest icons. |
| Sitemap/robots | Generated from the public route catalog on every production build. Private account paths are omitted from the sitemap. Robots is not treated as access control. |
| Alt text | Descriptive text and explicit intrinsic dimensions for the hero image; accessible SVG title and social-image descriptions. |
| Compression | Hero PNG replaced by WebP (391,596 → 22,230 bytes, about 94% smaller). Original images retained under `assets/source`, outside the published directory. |
| Speed | Route splitting, deferred homepage map, navigation search SDK on interaction, less hero animation. Lighthouse reports under `artifacts/`. |
| Contrast | Dark text on bright CTA fills, readable muted text/placeholders, clear focus styles, underlined inline links, reduced-motion support and immediate auth headings. |
| 404 | Branded React page and generated `404.html`. Known routes explicitly rewritten; unknown Vercel requests use the custom 404 with a real 404 status. |
| Validation | Shared account rules on client/server, normalized email, password byte limits, terms/age acknowledgement, bounded profile/vehicle input, future booking windows and midnight-safe durations. |
| Analytics | Consent-gated GA4 integration, explicit route tracking, public page allowlist, no URL query strings or arbitrary IDs. Owner measurement ID still needed. |
| CTA | Clear “Find chargers” homepage action. |
| Spam/bots | Honeypot, bounded per-instance API/auth rate limits, payload limits, server-verified Turnstile. Public signup cannot assign elevated roles. |
| Links | Removed fake subscription and social/app-store controls, replaced dead footer/sidebar destinations, real support page and sign-in help. |
| Mobile | Responsive hero/footer/legal/auth layouts, 320px minimum support, dynamic viewport map height, mobile map navigation and accessible navigation controls. |

## Verification and limits

- `npm run build` runs source/secret checks, **both** TypeScript projects, Vite, static metadata/sitemap generation, and scans production assets for configured server-only secrets. The old `tsc` command did not check the referenced app/server projects.
- `npm run test:security` exercises account/booking validation, cookie preference parsing, HTTPS redirects and unsafe requests, rate limits, honeypot and CAPTCHA failures/success using local HTTP servers. No production database writes.
- `npm run test:browser` checks generated metadata/assets, real 404 responses on the production preview, footer links, consent persistence/withdrawal, signup validation and desktop/mobile accessibility. Third-party Maps and analytics requests are intercepted for deterministic checks. This does not prove production Google Maps credentials, Turnstile configuration, database bookings or analytics ingestion.
- `npm run lint` checks the codebase. The 8 existing shared UI fast-refresh warnings are nonblocking; there are no lint errors.
- `node scripts/render-brand.mjs` regenerates PNG brand assets using installed Chrome. Originals are SVGs in `public/`.
- Final browser verification: all 10 tests passed with the test analytics build; the real no-ID build passed 8 tests, with only the 2 analytics-only storage cases skipped (already exercised in the test build). Eight server/security tests passed. The test ID was confirmed absent from final production assets.
- Baseline live mobile Lighthouse: performance **57**, accessibility **87**, LCP **9.3s**, TBT **460ms**, CLS **0**. Local results are lab measurements, not field data; check the deployed site again after release. See the report JSON/HTML for exact settings and timestamps.
- Per-instance rate limits do not aggregate across Vercel instances or cold starts. Add hosting firewall/distributed rate limits before relying on this layer against a distributed attack. Turnstile is the independently verified protection for public account forms.
- Existing account/vehicle/settings placeholders and unimplemented password reset remain visible as such; password help now reaches real support. The site is not represented as having functional newsletter signup, social login or native apps.
- Compatible dependency patches were applied. Remaining dependency advisories that require major tool/router upgrades are recorded separately; this work is not a complete penetration test.

## Primary implementation references

- [Google Maps API security](https://developers.google.com/maps/api-security-best-practices): browser keys require website/API restrictions; server credentials use separate keys.
- [Google Maps CSP](https://developers.google.com/maps/documentation/javascript/content-security-policy): Maps requires the permitted Google domains and evaluation/worker support. The configured CSP allows `unsafe-eval` for Maps but does not allow inline scripts.
- [Turnstile server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/): server-side token verification is required.
- [GA4 pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views): explicit SPA pageviews require disabling automatic/enhanced history tracking.
- [Vercel custom 404](https://vercel.com/kb/guide/custom-404-page): an output `404.html` handles unmatched routes.
- [MeitY data protection materials](https://www.meity.gov.in/content/digital-personal-data-protection-act-2023-2): background for owner review of the privacy notice. The website copy is not a certification of legal compliance.

## Dependency audit after compatible patches

`npm audit` reports 9 remaining advisories (8 moderate, 1 high; no critical). The high advisory is in the Vite development server; the esbuild/Drizzle/Vite plugin chain is development tooling. The production router has two moderate entries; remaining fixes require major tool/router upgrades. Do not expose the development server to untrusted networks. The patched `qs` parser is pinned through an override so Express also uses it. Major dependency migrations are outside this change and should be followed by a separate full routing/build regression check.

If browser storage writes fail, cookie rejection is maintained for the open document and analytics is disabled without forcing a reload. The old grant is removed where the browser permits it. If the browser blocks both saving and removal, a manual reload may recover the previous stored choice; allow storage changes or clear site data in browser settings to persist withdrawal.

## Final local lab result

Final production build, served with gzip using the local preview: performance **94/100**, accessibility **100/100**, best-practices **100/100**, seo **100/100**. LCP **2.7 s**, TBT **40 ms**, CLS **0**. Report: `artifacts/lighthouse-final.report.html` and `.json`. These localhost lab results do not replace a post-deployment measurement on the public domain.
