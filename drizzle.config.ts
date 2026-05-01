import { defineConfig } from 'drizzle-kit';
import { DATABASE_URL } from './server/config/index.js';

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
});
