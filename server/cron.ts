import cron from 'node-cron';
import { IngestionService } from './services/IngestionService';

export function startCronJobs() {
  console.log('Initializing cron jobs...');

  const ingestionService = new IngestionService();

  // Run the ingestion service every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log(`[Cron] Executing nightly EV station data ingestion...`);
    try {
      await ingestionService.runIngestion();
    } catch (error) {
      console.error('[Cron] Ingestion job failed:', error);
    }
  });

  console.log('Cron jobs scheduled: Nightly data ingestion at 2:00 AM');
}
