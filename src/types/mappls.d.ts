declare global {
  interface Window {
    mappls: MapplsInstance;
  }
  const mappls: MapplsInstance;
}

interface MapplsInstance {
  Map: new (id: string, options: MapOptions) => MapplsMap;
  Marker: new (options: MarkerOptions) => MapplsMarker;
  InfoWindow: new (options: InfoWindowOptions) => MapplsInfoWindow;
  nearby: (options: NearbyOptions) => void;
}

interface MapOptions {
  center: { lat: number; lng: number };
  zoom?: number;
  zoomControl?: boolean;
  location?: boolean;
  search?: boolean;
}

interface MapplsMap {
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  addListener: (event: string, callback: () => void) => void;
  remove: () => void;
}

interface MarkerOptions {
  map: MapplsMap;
  position: { lat: number; lng: number };
  title?: string;
  popupHtml?: string;
  icon?: string;
}

interface MapplsMarker {
  remove: () => void;
  on: (event: string, callback: () => void) => void;
}

interface InfoWindowOptions {
  content: string;
}

interface MapplsInfoWindow {
  open: (map: MapplsMap, marker: MapplsMarker) => void;
  close: () => void;
}

interface NearbyOptions {
  keywords: string;
  refLocation: [number, number];
  radius: number;
  region: string;
  map: MapplsMap;
  fitbounds?: boolean;
  callback: (data: NearbyResponse) => void;
}

interface NearbyResponse {
  suggestedLocations?: Station[];
}

export interface Station {
  placeName: string;
  placeAddress: string;
  latitude: string;
  longitude: string;
  distance: number;
  type?: string;
}
