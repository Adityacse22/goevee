import {
  mapSuggestion,
  pickBestLocation,
  type SearchResult,
  type SearchSuggestion,
} from '@/models/search.model';
import type { EVStation } from '@/models/station.model';



function googleUnavailable(): boolean {
  return !window.google?.maps;
}

export async function geocodeAddress(address: string): Promise<SearchResult | null> {
  if (!address.trim() || googleUnavailable()) return null;

  const geocoder = new window.google.maps.Geocoder();
  const response = await geocoder.geocode({ address: address.trim() });
  const result = response.results[0];
  if (!result) return null;

  return {
    lat: result.geometry.location.lat(),
    lng: result.geometry.location.lng(),
    name: result.formatted_address,
    address: result.formatted_address,
    eLoc: result.place_id ?? '',
    viewport: result.geometry.viewport?.toJSON(),
  };
}

export async function searchLocationSuggestions(
  query: string,
): Promise<SearchSuggestion[]> {
  if (!query.trim() || googleUnavailable()) return [];

  const service = new window.google.maps.places.AutocompleteService();

  return new Promise((resolve) => {
    service.getPlacePredictions({ input: query.trim() }, (predictions, status) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
        resolve([]);
        return;
      }

      resolve(predictions.slice(0, 6).map((prediction, index) => mapSuggestion({
        placeName: prediction.structured_formatting?.main_text ?? prediction.description,
        placeAddress: prediction.structured_formatting?.secondary_text ?? prediction.description,
        eLoc: prediction.place_id,
        type: prediction.types?.[0],
      }, query.trim(), index)));
    });
  });
}

export async function searchLocation(query: string): Promise<SearchResult | null> {
  const suggestions = await searchLocationSuggestions(query);
  const suggestion = pickBestLocation(suggestions);

  if (suggestion?.lat != null && suggestion.lng != null) {
    return suggestion;
  }

  return geocodeAddress(suggestion?.address || suggestion?.name || query);
}

export async function searchNearbyEVStations(
  lat: number,
  lng: number,
  radiusMeters = 5000,
): Promise<EVStation[]> {
  if (googleUnavailable()) return [];

  const center = new window.google.maps.LatLng(lat, lng);
  const mapElement = document.createElement('div');
  const service = new window.google.maps.places.PlacesService(mapElement);

  return new Promise((resolve) => {
    const request: google.maps.places.PlaceSearchRequest = {
      location: center,
      radius: radiusMeters,
      // Using both type and keyword for maximum precision
      type: 'electric_vehicle_charging_station',
      keyword: 'EV charging station',
    };

    service.nearbySearch(request, (results, status) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) {
        resolve([]);
        return;
      }

      const stations: EVStation[] = results
        .filter((place) => 
          // Strict filter: must be an EV station type
          place.types?.includes('electric_vehicle_charging_station') ||
          // Or name must contain relevant keywords to avoid schools/banks
          /EV|Charge|Charging|Station/i.test(place.name || '')
        )
        .map((place, index) => {
          if (!place.geometry?.location) return null;

          const sLat = place.geometry.location.lat();
          const sLng = place.geometry.location.lng();
          
          // Correct Haversine distance from search center (lat, lng) to station (sLat, sLng)
          const R = 6371e3;
          const φ1 = (lat * Math.PI) / 180;
          const φ2 = (sLat * Math.PI) / 180;
          const Δφ = ((sLat - lat) * Math.PI) / 180;
          const Δλ = ((sLng - lng) * Math.PI) / 180;
          const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return {
            id: place.place_id || `google-${index}`,
            name: place.name || 'EV Station',
            location: { lat: sLat, lng: sLng },
            address: place.vicinity || 'Address unavailable',
            rating: place.rating || 0,
            total_reviews: place.user_ratings_total || 0,
            price_per_kwh: 15,
            available: true,
            connectors: [
              {
                id: `${place.place_id}-c1`,
                station_id: place.place_id || '',
                connector_type: 'CCS2',
                power_output: 50,
                available: true,
                created_at: new Date().toISOString()
              }
            ],
            distance,
            isOpen: place.opening_hours?.isOpen() ?? true,
          };
        })
        .filter((s): s is EVStation => s !== null)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      resolve(stations);
    });
  });
}

export type { SearchResult, SearchSuggestion } from '@/models/search.model';
