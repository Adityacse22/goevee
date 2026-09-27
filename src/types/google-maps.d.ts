declare global {
  interface Window {
    google?: GoogleMapsNamespace;
  }

  const google: GoogleMapsNamespace;

  interface GoogleMapsNamespace {
    maps: {
      Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMap;
      Marker: new (options: GoogleMarkerOptions) => GoogleMarker;
      InfoWindow: new (options: GoogleInfoWindowOptions) => GoogleInfoWindow;
      LatLngBounds: new () => GoogleLatLngBounds;
      Geocoder: new () => GoogleGeocoder;
      places: {
        AutocompleteService: new () => GoogleAutocompleteService;
        PlacesServiceStatus: { OK: string };
      };
      importLibrary: (name: 'places') => Promise<GooglePlacesLibrary>;
    };
  }

  // ─── Places API (New) — google.maps.importLibrary('places') ────────────────

  interface GooglePlacesLibrary {
    Place: {
      searchNearby: (request: GoogleSearchNearbyRequest) => Promise<{ places: GooglePlace[] }>;
    };
    SearchNearbyRankPreference?: { DISTANCE: string; POPULARITY: string };
  }

  interface GoogleSearchNearbyRequest {
    fields: string[];
    locationRestriction: {
      center: { lat: number; lng: number };
      radius: number;
    };
    includedTypes?: string[];
    includedPrimaryTypes?: string[];
    maxResultCount?: number;
    rankPreference?: string;
    language?: string;
    region?: string;
  }

  interface GooglePlace {
    id: string;
    displayName?: string | null;
    formattedAddress?: string | null;
    location?: { lat: () => number; lng: () => number } | null;
    businessStatus?: string | null;
    rating?: number | null;
    userRatingCount?: number | null;
    evChargeOptions?: GoogleEVChargeOptions | null;
  }

  interface GoogleEVChargeOptions {
    connectorCount: number;
    connectorAggregations: GoogleConnectorAggregation[];
  }

  interface GoogleConnectorAggregation {
    type?: string | null;
    maxChargeRateKw: number;
    count: number;
    availableCount?: number | null;
    outOfServiceCount?: number | null;
    availabilityLastUpdateTime?: Date | null;
  }

  interface GoogleMapOptions {
    center: { lat: number; lng: number };
    zoom: number;
    mapTypeControl?: boolean;
    fullscreenControl?: boolean;
    streetViewControl?: boolean;
  }

  interface GoogleMap {
    setCenter: (center: { lat: number; lng: number }) => void;
    setZoom: (zoom: number) => void;
    fitBounds: (bounds: GoogleLatLngBounds) => void;
  }

  interface GoogleMarkerOptions {
    map: GoogleMap | null;
    position: { lat: number; lng: number };
    title?: string;
  }

  interface GoogleMarker {
    setMap: (map: GoogleMap | null) => void;
    addListener: (eventName: string, handler: () => void) => void;
  }

  interface GoogleInfoWindowOptions {
    content: string;
  }

  interface GoogleInfoWindow {
    open: (options: { map: GoogleMap; anchor: GoogleMarker }) => void;
  }

  interface GoogleLatLngBounds {
    extend: (point: { lat: number; lng: number }) => void;
  }

  interface GoogleGeocoder {
    geocode: (
      request: { address?: string; location?: { lat: number; lng: number } },
    ) => Promise<{ results: GoogleGeocoderResult[] }>;
  }

  interface GoogleGeocoderResult {
    formatted_address: string;
    geometry: {
      location: {
        lat: () => number;
        lng: () => number;
      };
    };
    place_id?: string;
    types?: string[];
  }

  interface GoogleAutocompletePrediction {
    place_id: string;
    description: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
    types?: string[];
  }

  interface GoogleAutocompleteService {
    getPlacePredictions: (
      request: { input: string },
      callback: (
        predictions: GoogleAutocompletePrediction[] | null,
        status: string,
      ) => void,
    ) => void;
  }
}

export {};
