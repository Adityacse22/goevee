import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import mkcert from 'vite-plugin-mkcert';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
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
    mkcert(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
