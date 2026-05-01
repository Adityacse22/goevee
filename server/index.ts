import { PORT } from './config/index.js';
import app from './app.js';
import { startCronJobs } from './cron.js';

app.listen(PORT, () => {
  console.log(`Evee API server running on port ${PORT}`);
  startCronJobs();
});
