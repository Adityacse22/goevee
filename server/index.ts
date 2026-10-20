import { PORT } from './config/index.js';
import app from './app.js';
import { startCronJobs } from './cron.js';

// Vercel imports this module from api/index.ts; everywhere else it is a long-running server,
// including `npm run start:server` with NODE_ENV=production. Only skip listening on Vercel.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Evee API server running on port ${PORT}`);
    startCronJobs();
  });
}
