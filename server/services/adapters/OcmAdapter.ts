import { BaseAdapter, NormalizedStationData } from './BaseAdapter';

export class OcmAdapter extends BaseAdapter {
  sourceName = 'OPEN_CHARGE_MAP';
  private apiKey: string;

  constructor() {
    super();
    this.apiKey = process.env.OCM_API_KEY || '';
  }

  async fetchStations(): Promise<any[]> {
    try {
      const url = this.apiKey 
        ? `https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&maxresults=50&key=${this.apiKey}`
        : `https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&maxresults=50`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('OCM fetch failed');
      return await response.json();
    } catch (error) {
      console.error('Error fetching OCM data:', error);
      return [];
    }
  }

  normalizeStation(rawData: any): NormalizedStationData | null {
    if (!rawData.AddressInfo || !rawData.AddressInfo.Latitude || !rawData.AddressInfo.Longitude) {
      return null;
    }

    const station = {
      name: rawData.AddressInfo.Title || 'OCM Station',
      address: rawData.AddressInfo.AddressLine1 || 'Unknown Address',
      city: rawData.AddressInfo.Town || null,
      state: rawData.AddressInfo.StateOrProvince || null,
      country: 'India',
      latitude: String(rawData.AddressInfo.Latitude),
      longitude: String(rawData.AddressInfo.Longitude),
      status: 'ACTIVE' as const,
    };

    const chargers: NormalizedStationData['chargers'] = [];
    
    if (rawData.Connections && Array.isArray(rawData.Connections) && rawData.Connections.length > 0) {
      rawData.Connections.forEach((conn: any, index: number) => {
        chargers.push({
          stationId: '', // Will be assigned during insertion
          chargerCode: `OCM-${rawData.ID}-${index}`,
          connectorType: conn.ConnectionType?.Title || 'Unknown',
          powerOutputKw: conn.PowerKW ? String(conn.PowerKW) : '5', // Default 5kw
          status: 'AVAILABLE' as const,
        });
      });
    } else {
      chargers.push({
        stationId: '',
        chargerCode: `OCM-${rawData.ID}-0`,
        connectorType: 'Standard Plug',
        powerOutputKw: '3.3',
        status: 'AVAILABLE' as const,
      });
    }

    return { station, chargers };
  }
}
