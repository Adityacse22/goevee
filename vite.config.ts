import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const allowed = new Set([
    'VITE_GOOGLE_MAPS_API_KEY', 'VITE_API_BASE_URL', 'VITE_GA_MEASUREMENT_ID', 'VITE_TURNSTILE_SITE_KEY',
    // Vercel injects these documented public deployment values for its Vite preset.
    // Keep this explicit list synchronized with scripts/check-secrets.mjs.
    // https://vercel.com/docs/environment-variables/framework-environment-variables
    'VITE_VERCEL_ENV', 'VITE_VERCEL_TARGET_ENV', 'VITE_VERCEL_URL', 'VITE_VERCEL_BRANCH_URL',
    'VITE_VERCEL_PROJECT_PRODUCTION_URL', 'VITE_VERCEL_HASH_SALT', 'VITE_VERCEL_GIT_PROVIDER',
    'VITE_VERCEL_GIT_REPO_SLUG', 'VITE_VERCEL_GIT_REPO_OWNER', 'VITE_VERCEL_GIT_REPO_ID',
    'VITE_VERCEL_GIT_COMMIT_REF', 'VITE_VERCEL_GIT_COMMIT_SHA', 'VITE_VERCEL_GIT_COMMIT_MESSAGE',
    'VITE_VERCEL_GIT_COMMIT_AUTHOR_LOGIN', 'VITE_VERCEL_GIT_COMMIT_AUTHOR_NAME', 'VITE_VERCEL_GIT_PULL_REQUEST_ID',
  ]);
  for (const key of Object.keys(env)) if (!allowed.has(key)) throw new Error(`Unapproved browser-visible variable: ${key}`);
  const api = env.VITE_API_BASE_URL || '/api/v1';
  if (mode === 'production' && !api.startsWith('/') && !api.startsWith('https://')) throw new Error('Production API must use HTTPS or a same-origin path');
  return ({
  server: {
    host: "127.0.0.1",
    port: 8080,

    proxy: {
      '/api/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/api/mappls-atlas': {
        target: 'https://atlas.mappls.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mappls-atlas/, ''),
      },
      '/api/mappls-search': {
        target: 'https://search.mappls.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mappls-search/, ''),
      },
      '/api/mappls-place': {
        target: 'https://place.mappls.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mappls-place/, ''),
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
});
