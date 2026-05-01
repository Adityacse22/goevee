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
    };
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
