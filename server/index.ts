import { PORT } from './config/index.js';
import app from './app.js';
import { startCronJobs } from './cron.js';

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Evee API server running on port ${PORT}`);
    startCronJobs();
  });
}
