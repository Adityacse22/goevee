import { db } from '../db';
import { stations, chargers } from '../db/schema';
import { BaseAdapter } from './adapters/BaseAdapter';
import { OcmAdapter } from './adapters/OcmAdapter';
import { DelhiAdapter } from './adapters/DelhiAdapter';

export class IngestionService {
  private adapters: BaseAdapter[];

  constructor() {
    this.adapters = [
      new OcmAdapter(),
      new DelhiAdapter()
    ];
  }

  async runIngestion() {
    console.log('Starting EV Station data ingestion process...');
    
    for (const adapter of this.adapters) {
      console.log(`Running adapter: ${adapter.sourceName}`);
      try {
        const normalizedDataList = await adapter.process();
        
        console.log(`Upserting ${normalizedDataList.length} stations from ${adapter.sourceName}`);
        
        let successCount = 0;
        let failCount = 0;

        for (const data of normalizedDataList) {
          try {
            // Using Drizzle to insert station and chargers.
            // For MVP, we insert avoiding duplicates if needed, or just insert new ones.
            const insertedStation = await db.insert(stations)
              .values(data.station)
              .returning({ id: stations.id });
              
            const stationId = insertedStation[0].id;
            
            if (data.chargers.length > 0) {
              const chargersToInsert = data.chargers.map(c => ({
                ...c,
                stationId
              }));
              await db.insert(chargers).values(chargersToInsert);
            }
            successCount++;
          } catch (error) {
            failCount++;
            console.error(`Failed to ingest station ${data.station.name}:`, error);
          }
        }
        console.log(`Adapter ${adapter.sourceName} finished: ${successCount} successful, ${failCount} failed.`);
      } catch (adapterError) {
        console.error(`Adapter ${adapter.sourceName} failed critically:`, adapterError);
      }
    }
    
    console.log('Data ingestion complete.');
  }
}
