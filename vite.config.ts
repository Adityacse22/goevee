import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/** Preloads the Latin subsets of the two brand fonts so text renders in them on first paint. */
const preloadBrandFonts = (): Plugin => ({
  name: 'goevee-preload-brand-fonts',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(_html, ctx) {
      return Object.keys(ctx.bundle ?? {})
        .filter(file => /(?:^|\/)(?:inter|plus-jakarta-sans)-latin-wght-normal-[\w-]+\.woff2$/.test(file))
        .map(file => ({
          tag: 'link',
          attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: '' },
          injectTo: 'head' as const,
        }));
    },
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const allowed = new Set([
    'VITE_GOOGLE_MAPS_API_KEY', 'VITE_API_BASE_URL', 'VITE_GA_MEASUREMENT_ID', 'VITE_TURNSTILE_SITE_KEY',
  ]);
  const isAllowed = (key: string) => allowed.has(key) || key.startsWith('VITE_VERCEL_');
  for (const key of Object.keys(env)) if (!isAllowed(key)) throw new Error(`Unapproved browser-visible variable: ${key}`);
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
    preloadBrandFonts(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Keep font subsets as files: the CSP's font-src forbids data: URIs, and
    // unicode-range lets browsers skip subsets the page never uses.
    assetsInlineLimit: (filePath: string) => (filePath.endsWith('.woff2') ? false : undefined),
  },
});
});
