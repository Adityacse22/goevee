import { BaseAdapter, NormalizedStationData } from './BaseAdapter.js';

interface DelhiStation { lat?: number; lon?: number; stationName?: string; streetAddress?: string; id?: string | number; plugType?: string; kw?: number; }

export class DelhiAdapter extends BaseAdapter<DelhiStation> {
  sourceName = 'DELHI_EV_PORTAL';

  async fetchStations(): Promise<DelhiStation[]> {
    // For the MVP, if the Switch Delhi API is protected or requires scraping,
    // this acts as a stub that could fetch from a local JSON or mock data
    // until web scraping or official API access is implemented.
    console.log('Delhi EV Portal ingestion initialized (stubbed for MVP)');
    return [];
  }

  normalizeStation(rawData: DelhiStation): NormalizedStationData | null {
    // Example normalization assuming a hypothetical Delhi API JSON response
    if (!rawData.lat || !rawData.lon) return null;

    const station = {
      name: rawData.stationName || 'Delhi Govt Station',
      address: rawData.streetAddress || 'Delhi',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      latitude: String(rawData.lat),
      longitude: String(rawData.lon),
      status: 'ACTIVE' as const,
    };

    const chargers: NormalizedStationData['chargers'] = [];
    chargers.push({
      stationId: '',
      chargerCode: `DELHI-${rawData.id || Math.random().toString(36).substring(7)}`,
      connectorType: rawData.plugType || 'CCS2',
      powerOutputKw: rawData.kw ? String(rawData.kw) : '22',
      status: 'AVAILABLE' as const,
    });

    return { station, chargers };
  }
}
