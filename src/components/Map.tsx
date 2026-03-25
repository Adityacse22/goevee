import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useMapplsLoader } from '@/hooks/useMapplsLoader';

interface Location {
  lat: number;
  lng: number;
}

interface Connector {
  id: string;
  station_id: string;
  connector_type: string;
  power_output: number;
  available: boolean;
  created_at: string;
}

export interface EVStation {
  id: string;
  name: string;
  location: Location;
  rating: number;
  total_reviews: number;
  address: string;
  price_per_kwh: number;
  available: boolean;
  connectors: Connector[];
  distance?: number;
  isOpen?: boolean;
}

interface MapComponentProps {
  externalSearchQuery?: string;
  triggerSearch?: number;
  onStationsUpdate?: (stations: EVStation[]) => void;
  onSearchingChange?: (isSearching: boolean) => void;
  onHighlightedStationChange?: (id: string | null) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  externalSearchQuery = '',
  triggerSearch = 0,
  onStationsUpdate,
  onSearchingChange,
  onHighlightedStationChange
}) => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [stations, setStations] = useState<EVStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [searchRadius, setSearchRadius] = useState(50000); // 50km
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  
  const sdkStatus = useMapplsLoader();

  // Diagnostic Logs
  useEffect(() => {
    console.group('🗺️ MAP DEBUG');
    console.log('1. window.mappls:', window.mappls);
    console.log('2. MAPPLS_KEY:', import.meta.env.VITE_MAPPLS_KEY);
    console.log('3. map container el:', document.getElementById('map'));
    console.log('4. container height:', document.getElementById('map')?.getBoundingClientRect());
    console.groupEnd();
  }, []);

  const radiusOptions = [
    { value: 10000, label: '10 km' },
    { value: 25000, label: '25 km' },
    { value: 50000, label: '50 km' },
    { value: 100000, label: '100 km' }
  ];

  // Initialize Map
  useEffect(() => {
    if (sdkStatus !== 'ready') return;
    if (mapRef.current) return; // prevent double init
    if (!mapContainerRef.current) return;
    
    try {
      mapRef.current = new window.mappls.Map('map', {
        center: { lat: 28.6139, lng: 77.2090 }, // Default Delhi
        zoom: 12,
        zoomControl: true,
        location: true,
        search: false // Disabled default search to use our own
      });

      mapRef.current.addListener('load', () => {
        setMapLoaded(true);
        setLoading(false);
        console.log('Mappls map loaded');
        
        if (userLocation) {
          fetchNearbyStations(userLocation);
        }
      });
    } catch (e) {
      console.error("Error initializing Mappls Map:", e);
      setLoading(false);
      toast.error("Failed to load map. Check API Key format.");
    }

    return () => {
      // Clear markers on unmount
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
    };
  }, [sdkStatus, userLocation]); // removed fetchNearbyStations from dep array temporarily to avoid recursive loops

  // Fetch stations using Mappls Nearby plugin
  const fetchNearbyStations = useCallback((location: Location) => {
    if (isSearching || !mapRef.current || !window.mappls.nearby) return;

    setIsSearching(true);
    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    setStations([]);

    window.mappls.nearby({
      keywords: 'EV Charging Station',
      refLocation: [location.lat, location.lng],
      radius: searchRadius,
      region: 'IND',
      map: mapRef.current,
      fitbounds: false,
      callback: (data: any) => {
        setIsSearching(false);
        
        if (!data || !data.suggestedLocations || data.suggestedLocations.length === 0) {
          toast.error('No EV charging stations found in this area.');
          return;
        }

        const validStations: EVStation[] = data.suggestedLocations.map((place: any, index: number) => {
          // Normalize Mappls API properties to match EVStation props
          return {
            id: place.eLoc || place.poiId || Math.random().toString(),
            name: place.placeName || 'Unknown Station',
            location: {
              lat: parseFloat(place.latitude),
              lng: parseFloat(place.longitude),
            },
            address: place.placeAddress || place.vicinity || 'Address not available',
            rating: place.rating || (3.5 + Math.random() * 1.5),
            total_reviews: place.totalReviews || Math.floor(Math.random() * 50),
            price_per_kwh: 15, // Default Indian Rupee mock price
            available: Math.random() > 0.3, // Mock operational state
            distance: place.distance || undefined,
            isOpen: true,
            connectors: [
              {
                id: `conn_${index}_1`,
                station_id: place.eLoc || '',
                connector_type: 'CCS2',
                power_output: 50,
                available: true,
                created_at: new Date().toISOString()
              }
            ]
          };
        });

        toast.success(`Found ${validStations.length} charging stations`);
        setStations(validStations);
        renderMarkers(validStations);
        
        // Auto-fit bounds
        if (validStations.length > 0) {
           // Basic panning if fitbounds doesn't work out of the box
           mapRef.current.setCenter({ lat: validStations[0].location.lat, lng: validStations[0].location.lng });
           mapRef.current.setZoom(12);
        }
      }
    });
  }, [searchRadius, isSearching]);

  const renderMarkers = (stationList: EVStation[]) => {
    stationList.forEach(station => {
      const marker = new window.mappls.Marker({
        map: mapRef.current,
        position: { lat: station.location.lat, lng: station.location.lng },
        popupHtml: `
          <div class="popup-dark" style="background:#1a1a1a; color:#fff; padding:10px; border-radius:8px;">
            <strong>${station.name}</strong>
            <p style="font-size: 12px; color: #aaa; margin: 5px 0;">${station.address}</p>
            <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: ${station.available ? '#00c9a7' : '#ff4d4d'}; color: ${station.available ? '#000': '#fff'}">
              ${station.available ? 'Available' : 'Busy'}
            </span>
          </div>
        `
      });
      
      markersRef.current[station.id] = marker;
    });
  };

  // Mappls REST API Geocoding
  const geocodeLocation = async (query: string): Promise<Location | null> => {
    try {
      const MAPPLS_KEY = import.meta.env.VITE_MAPPLS_KEY;
      if (!MAPPLS_KEY) {
         toast.error("VITE_MAPPLS_KEY is missing from environment");
         return null;
      }
      const res = await fetch(
        `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(query)}&region=IND`,
        { headers: { Authorization: `bearer ${MAPPLS_KEY}` } }
      );
      const data = await res.json();
      if (data.copResults) {
        return {
          lat: parseFloat(data.copResults.latitude),
          lng: parseFloat(data.copResults.longitude)
        };
      }
      throw new Error('Location not found in Mappls');
    } catch(e) {
      console.error(e);
      return null;
    }
  };

  const handleSearch = useCallback(async (queryOverride?: string) => {
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;

    setIsSearching(true);
    setLoading(true);

    const coords = await geocodeLocation(query);
    if (!coords) {
       toast.error('Location not found. Please try a different search term.');
       setIsSearching(false);
       setLoading(false);
       return;
    }

    if (mapRef.current) {
      mapRef.current.setCenter(coords);
      mapRef.current.setZoom(13);
    }
    
    // Pass coordinates to Mappls nearby
    fetchNearbyStations(coords);
    setIsSearching(false);
    setLoading(false);
  }, [searchQuery, fetchNearbyStations]);

  // Handle external search props
  useEffect(() => {
    if (triggerSearch > 0 && externalSearchQuery) {
      setSearchQuery(externalSearchQuery);
      handleSearch(externalSearchQuery);
    }
  }, [triggerSearch, externalSearchQuery, handleSearch]);

  // Bubble up stations
  useEffect(() => {
    onStationsUpdate?.(stations);
  }, [stations, onStationsUpdate]);

  useEffect(() => {
    onSearchingChange?.(isSearching);
  }, [isSearching, onSearchingChange]);

  const handleFindNearby = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
         const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
         setUserLocation(loc);
         if (mapRef.current) {
            mapRef.current.setCenter(loc);
            mapRef.current.setZoom(14);
         }
         fetchNearbyStations(loc);
      },
      (error) => {
         toast.error('Error getting location. Please enable location permissions.');
         setLoading(false);
      }
    );
  }, [fetchNearbyStations]);

  return (
    <div className="relative w-full h-full">
      {/* Top Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2 max-w-sm">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-2 flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            className="flex-1 px-3 py-2 border rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-2">
           <label className="block text-sm font-medium">Search Radius ({searchRadius/1000}km)</label>
           <select 
             value={searchRadius} 
             onChange={(e) => setSearchRadius(Number(e.target.value))}
             className="w-full mt-1 border rounded-md px-2 py-1"
           >
             {radiusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
           </select>
        </div>

        <button
          onClick={handleFindNearby}
          className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md hover:bg-white"
        >
          Find My Location
        </button>
      </div>

      {loading && sdkStatus === 'ready' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {/* Mappls Error State */}
      {sdkStatus === 'error' && (
        <div style={{
          display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', 
          height: '100%', minHeight: '600px',
          gap: '12px', color: '#00c9a7'
        }}>
          <p>Map failed to load.</p>
          <p style={{ fontSize: '13px', color: '#888' }}>
            Check that your Mappls API key is correctly set in index.html
          </p>
        </div>
      )}

      {/* Mappls Loading State */}
      {sdkStatus === 'loading' && (
        <div style={{ 
          display: 'flex', alignItems: 'center', 
          justifyContent: 'center', height: '100%', minHeight: '600px', color: '#888' 
        }}>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p>Booting SDK...</p>
        </div>
      )}

      {/* Mappls Map Container */}
      <div 
        ref={mapContainerRef} 
        id="map" 
        style={{ width: '100%', height: '100vh', minHeight: '600px', display: sdkStatus === 'ready' ? 'block' : 'none' }}
      />
    </div>
  );
};

export default MapComponent;