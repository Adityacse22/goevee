# Project State

> Last updated: 2026-03-25

## Last Session Summary
Codebase mapping complete.
- 11 major components identified
- 25+ production dependencies analyzed
- 9 technical debt items found
- Architecture documented in ARCHITECTURE.md
- Stack documented in STACK.md


## Website readiness implementation — 1 October 2026

User requested twenty privacy/security/SEO/accessibility/performance improvements. Working tree contains implementation; nothing has been deployed or pushed. Support email is contact.goevee@gmail.com; no real GA measurement ID or Turnstile keys supplied. See docs/WEBSITE_READINESS.md for owner setup.

Completed: public legal/help/about pages; consent-gated analytics; static metadata and 404 HTML; original social/favicon assets; generated sitemap/robots; secret scans and removed tracked test credential; HTTPS/headers; validation and bot checks; image compression, deferred maps, route splitting, mobile navigation/link/contrast fixes.

Verification so far: frontend/server typechecks and production build pass; 8 security tests pass; ESLint has 0 errors with pre-existing Fast Refresh warnings. Browser tests exposed transient opacity, a search button contrast issue and an unlabeled map radius selector, all corrected; final run pending. Independent read-only review found and fixed consent write-failure/reload and shared station canonical issues.

Speed baseline live: mobile performance 57, LCP 9.3s, TBT 460ms. First local uncompressed run: performance 77, LCP 4.3s, TBT 0ms; compressed preview recheck pending. Screenshots/reports in ignored artifacts/.

Next: run final browser suite with dummy analytics ID (network intercepted), restore real no-ID build, verify screenshots and record final evidence. No production database writes or credentials changed.

### Final verification

Production build and both TypeScript projects pass; secret/source/bundle scans pass; final assets contain no test GA ID. Security tests: 8/8. Browser tests with intercepted test analytics: 10/10; final no-ID build: 8 pass, 2 analytics-specific cases skipped after prior successful test. Lint: 0 errors, 8 existing Fast Refresh warnings. Visual review verified mobile home/auth/map/legal/404 and social art. Final local Lighthouse: {'performance': 94, 'accessibility': 100, 'best-practices': 100, 'seo': 100}; LCP 2.7 s, TBT 40 ms. Owner configuration and production deployment remain, documented in docs/WEBSITE_READINESS.md. GitHub publication requested by the owner with commit message “Checks update”.


### Publication request

The owner authorized committing and pushing to GitHub to update the connected live site, using the exact commit message `Checks update`. Vercel now explicitly uses npm ci, npm run build and dist to avoid stale package-manager lockfile selection. Production environment configuration remains documented in docs/WEBSITE_READINESS.md.
