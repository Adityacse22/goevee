import { InferInsertModel } from 'drizzle-orm';
import { stations, chargers } from '../../db/schema';

export type InsertStation = InferInsertModel<typeof stations>;
export type InsertCharger = InferInsertModel<typeof chargers>;

export interface NormalizedStationData {
  station: InsertStation;
  chargers: InsertCharger[];
}

export abstract class BaseAdapter {
  abstract sourceName: string;
  abstract fetchStations(): Promise<any[]>;
  abstract normalizeStation(rawData: any): NormalizedStationData | null;

  async process(): Promise<NormalizedStationData[]> {
    const rawData = await this.fetchStations();
    const normalized: NormalizedStationData[] = [];
    
    for (const data of rawData) {
      const result = this.normalizeStation(data);
      if (result) {
        normalized.push(result);
      }
    }
    
    return normalized;
  }
}
