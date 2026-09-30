// Vite client type declarations — inlined to avoid CI resolution failures.
// When vite/client can be resolved (local dev), the triple-slash reference
// provides full type coverage (HMR, asset imports, etc.). When it can't
// (some CI environments), the fallback interface declarations below ensure
// import.meta.env always type-checks.

/// <reference types="vite/client" />

// Fallback: declare import.meta.env directly so tsc never fails on TS2339,
// even if the triple-slash reference above can't resolve vite/client.d.ts.
interface ImportMetaEnv {
  [key: string]: any
  readonly BASE_URL: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
  // App-specific variables
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_GA_MEASUREMENT_ID: string
  readonly VITE_TURNSTILE_SITE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
