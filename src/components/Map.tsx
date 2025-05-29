import { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, InfoWindow, Circle } from '@react-google-maps/api';
import { toast } from 'react-hot-toast';

// Define libraries as a constant outside the component
const LIBRARIES: ("places" | "geometry" | "marker")[] = ["places", "geometry", "marker"];

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

interface EVStation {
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

const MapComponent = () => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [stations, setStations] = useState<EVStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<EVStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchRadius, setSearchRadius] = useState(50000); // 50km radius
  const [isSearching, setIsSearching] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isStationListVisible, setIsStationListVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance');
  const [filterAvailable, setFilterAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const watchIdRef = useRef<number>();
  const markersRef = useRef<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});
  const mapRef = useRef<google.maps.Map | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [hasFoundStations, setHasFoundStations] = useState(false);

  const GOOGLE_MAPS_API_KEY = "AIzaSyBL1KIfvIWVeRYRmBcuEO7QYILIty43Aek";

  const radiusOptions = [
    { value: 10000, label: '10 km' },
    { value: 25000, label: '25 km' },
    { value: 50000, label: '50 km' },
    { value: 100000, label: '100 km' }
  ];

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  };

  const center = userLocation || { lat: 28.6139, lng: 77.2090 }; // Default to Delhi

  // Add map ID for Advanced Markers
  const mapId = "YOUR_MAP_ID"; // You'll need to create this in Google Cloud Console

  // Fetch nearby EV stations using Places API
  const fetchNearbyStations = useCallback(
    async (location: Location) => {
      if (isSearching || !mapRef.current || hasFoundStations) return;

      try {
        setIsSearching(true);
        setLoading(true);

        // First check if Places API is available
        if (!google.maps.places) {
          throw new Error('Places API is not available. Please check your API key configuration.');
        }

        // Create a search request with broader parameters
        const request = {
          location: new google.maps.LatLng(location.lat, location.lng),
          radius: searchRadius,
          type: 'charging_station',
          keyword: 'electric vehicle charging station'
        };

        // Use the new Places API
        const placesService = new google.maps.places.PlacesService(mapRef.current);
        
        const results = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
          placesService.nearbySearch(request, (results, status) => {
            console.log('Places API response:', { status, resultsCount: results?.length });
            
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results);
            } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
              reject(new Error('Places API access denied. Please check your API key configuration.'));
            } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
              reject(new Error('API quota exceeded. Please try again later.'));
            } else if (status === google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
              reject(new Error('Invalid request to Places API. Please check your search parameters.'));
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              // Return empty array instead of error for no results
              resolve([]);
            } else {
              reject(new Error(`Search failed: ${status}`));
            }
          });
        });

        if (!results || results.length === 0) {
          setStations([]);
          setHasFoundStations(false); // Ensure hasFoundStations is false on zero results
          setIsStationListVisible(false); // Hide list on zero results
          if (!hasFoundStations) {
            toast.error('No charging stations found within the search radius. Try increasing the radius or searching in a different area.');
          }
          return;
        }

        // Get detailed information for each place
        const formattedStations = await Promise.all(results.map(async (place) => {
          try {
            const details = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
              placesService.getDetails(
                { placeId: place.place_id },
                (result, status) => {
                  if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                    resolve(result);
                  } else {
                    reject(new Error(`Failed to get details for place: ${status}`));
                  }
                }
              );
            });

            const station = {
              id: place.place_id || Math.random().toString(),
              name: place.name || 'Unknown Station',
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
              rating: place.rating || 0,
              total_reviews: place.user_ratings_total || 0,
              address: place.vicinity || 'Address not available',
              price_per_kwh: 0.40, // Default price
              available: place.business_status === 'OPERATIONAL',
              connectors: [
                {
                  id: `${place.place_id}_1`,
                  station_id: place.place_id || '',
                  connector_type: 'Type 2',
                  power_output: 22,
                  available: true,
                  created_at: new Date().toISOString()
                }
              ]
            };

            // Log each station's details
            console.log('Found Station:', {
              name: station.name,
              address: station.address,
              location: station.location,
              rating: station.rating,
              reviews: station.total_reviews,
              status: station.available ? 'Available' : 'Unavailable',
              details: details
            });

            return station;
          } catch (error) {
            console.error('Error processing station:', error);
            return null;
          }
        }));

        // Filter out null results and update stations
        const validStations = formattedStations.filter(station => station !== null) as EVStation[];
        
        if (validStations.length > 0) {
          setStations(validStations);
          setHasFoundStations(true);
          setIsStationListVisible(true); // Explicitly set list visible on success
          setViewMode('list'); // Switch to list view on success
          
          // Only show success toast if this is the first time finding stations
          if (!hasFoundStations) {
            toast.success(`Found ${validStations.length} charging stations`);
          }
          
          // Log summary of found stations
          console.log('Stations Summary:', {
            totalFound: validStations.length,
            stations: validStations.map(s => ({
              name: s.name,
              address: s.address,
              rating: s.rating
            }))
          });

          // Update map bounds to show all stations
          if (mapRef.current && validStations.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            validStations.forEach(station => {
              bounds.extend(new google.maps.LatLng(station.location.lat, station.location.lng));
            });
            mapRef.current.fitBounds(bounds);
          }
        } else { // Explicitly handle zero results
          setStations([]);
          setHasFoundStations(false); // Ensure hasFoundStations is false
          setIsStationListVisible(false); // Hide list on zero results
          if (!hasFoundStations) {
            toast.error('No charging stations found within the search radius. Try increasing the radius or searching in a different area.');
          }
        }

      } catch (error) {
        console.error('Error fetching stations:', error);
        let errorMessage = 'Failed to load charging stations. ';
        
        if (error instanceof Error) {
          if (error.message.includes('API key')) {
            errorMessage += 'Please check your API key configuration.';
          } else if (error.message.includes('quota')) {
            errorMessage += 'API quota exceeded. Please try again later.';
          } else {
            errorMessage += error.message;
          }
        }
        
        if (!hasFoundStations) {
          toast.error(errorMessage);
        }
        setStations([]);
        setHasFoundStations(false); // Ensure hasFoundStations is false on error
        setIsStationListVisible(false); // Hide list on error
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [searchRadius, isSearching, hasFoundStations] // Added isSearching and hasFoundStations to dependencies
  );

  // Create markers for stations
  useEffect(() => {
    if (!map || !stations.length) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.map = null);
    markersRef.current = {};

    // Create new markers
    stations.forEach(station => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: station.location,
        title: station.name,
      });

      marker.addListener('click', () => {
        setSelectedStation(station);
      });

      markersRef.current[station.id] = marker;
    });

    return () => {
      // Cleanup markers
      Object.values(markersRef.current).forEach(marker => marker.map = null);
      markersRef.current = {};
    };
  }, [map, stations]);

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMap(map);
    if (userLocation) {
      fetchNearbyStations(userLocation);
    }
  }, [userLocation, fetchNearbyStations]);

  // Update user location
  const updateUserLocation = useCallback((position: GeolocationPosition) => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    console.log('Location updated:', newLocation);
    setUserLocation(newLocation);
    setLocationPermissionGranted(true);
    if (mapRef.current) {
      fetchNearbyStations(newLocation);
    }
  }, [fetchNearbyStations]);

  // Request location permission
  const requestLocationPermission = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setIsRetrying(false);
    retryCountRef.current = 0;

    const getLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location obtained:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          updateUserLocation(position);
          setLoading(false);
        },
        (error) => {
          console.error('Location error:', {
            code: error.code,
            message: error.message
          });

          if (error.code === error.TIMEOUT && retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current += 1;
            setIsRetrying(true);
            toast.error(`Location timeout. Retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
            setTimeout(getLocation, 1000);
            return;
          }

          // Handle other errors or max retries reached
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error('Location access denied. Please enable location services.');
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error('Location information is unavailable.');
              break;
            case error.TIMEOUT:
              toast.error('Location request timed out. Using default location.');
              break;
            default:
              toast.error('Error getting location. Using default location.');
          }

          // Use default location
          const defaultLocation = { lat: 28.6139, lng: 77.2090 };
          setUserLocation(defaultLocation);
          if (mapRef.current) {
            fetchNearbyStations(defaultLocation);
          }
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout to 15 seconds
          maximumAge: 10000 // Allow cached positions up to 10 seconds old
        }
      );
    };

    getLocation();
  }, [updateUserLocation, fetchNearbyStations]);

  // Update the location watching logic to prevent unnecessary updates
  useEffect(() => {
    let watchId: number | undefined;

    if (locationPermissionGranted && navigator.geolocation && !hasFoundStations) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          console.log('Location watch update:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          updateUserLocation(position);
        },
        (error) => {
          console.error('Watch position error:', error.message);
          // Don't show error toast for watch errors to avoid spamming
          if (error.code === error.TIMEOUT) {
            // Silently retry on timeout
            return;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [locationPermissionGranted, updateUserLocation, hasFoundStations]);

  // Check location permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          if (result.state === 'granted') {
            setLocationPermissionGranted(true);
            requestLocationPermission();
          } else if (result.state === 'prompt') {
            toast('Please allow location access to find nearby stations');
          }
        } catch (error) {
          console.error('Error checking location permission:', error);
        }
      }
    };

    checkPermission();
  }, [requestLocationPermission]);

  // Add API key validation
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing');
      toast.error('Map configuration error. Please contact support.');
      return;
    }

    // Validate API key format
    if (!GOOGLE_MAPS_API_KEY.startsWith('AIza')) {
      console.error('Invalid Google Maps API key format');
      toast.error('Invalid map configuration. Please contact support.');
      return;
    }
  }, []);

  // Add sorting and filtering functions
  const getSortedAndFilteredStations = useCallback(() => {
    if (!stations.length) return [];

    let filteredStations = stations;

    // Apply availability filter
    if (filterAvailable) {
      filteredStations = filteredStations.filter(station => station.available);
    }

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredStations = filteredStations.filter(station => 
        station.name.toLowerCase().includes(query) ||
        station.address.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    return filteredStations.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return a.price_per_kwh - b.price_per_kwh;
        case 'distance':
        default:
          if (!userLocation) return 0;
          const distA = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userLocation.lat, userLocation.lng),
            new google.maps.LatLng(a.location.lat, a.location.lng)
          );
          const distB = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userLocation.lat, userLocation.lng),
            new google.maps.LatLng(b.location.lat, b.location.lng)
          );
          return distA - distB;
      }
    });
  }, [stations, sortBy, filterAvailable, searchQuery, userLocation]);

  // Update the InfoWindow content to show more station details
  const renderStationInfo = (station: EVStation) => (
    <div className="p-2">
      <h3 className="font-bold text-lg">{station.name}</h3>
      <p className="text-sm text-gray-600">{station.address}</p>
      <div className="flex items-center mt-1">
        <span className="text-yellow-500">★</span>
        <span className="ml-1">{station.rating.toFixed(1)}</span>
        <span className="text-gray-500 text-sm ml-1">
          ({station.total_reviews} reviews)
        </span>
      </div>
      <div className="mt-2">
        <p className="text-sm">
          <span className="font-medium">Price:</span> ${station.price_per_kwh}/kWh
        </p>
        <p className="text-sm">
          <span className="font-medium">Status:</span>{' '}
          <span className={station.available ? 'text-green-500' : 'text-red-500'}>
            {station.available ? 'Available' : 'Unavailable'}
          </span>
        </p>
        <div className="mt-2">
          <p className="text-sm font-medium">Connectors:</p>
          <ul className="text-sm">
            {station.connectors.map(connector => (
              <li key={connector.id} className="flex items-center mt-1">
                <span className={connector.available ? 'text-green-500' : 'text-red-500'}>●</span>
                <span className="ml-2">
                  {connector.connector_type} ({connector.power_output}kW)
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => {
            setViewMode('list');
            setIsStationListVisible(true);
          }}
          className="mt-3 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>Show All Stations</span>
        </button>
      </div>
    </div>
  );

  // Update the station list display to correctly use station properties
  const renderStationList = () => {
    // Render the list only if it's visible AND there are stations to show
    if (!isStationListVisible || stations.length === 0) return null; 

    return (
      <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            {/* Update header to reflect actual station count */}
            <h2 className="text-xl font-semibold">Found Stations ({stations.length})</h2> 
            <div className="flex items-center space-x-4">
              {/* "Back to Map" button to switch view */}
              <button
                onClick={() => {
                  setViewMode('map');
                  // setIsStationListVisible(false); // Keep the list data, just hide the view
                }}
                className="text-blue-500 hover:text-blue-600 flex items-center space-x-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Back to Map</span>
              </button>
              {/* Close button for the list */}
              <button
                onClick={() => setIsStationListVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Station List Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Use getSortedAndFilteredStations for rendering */}
              {getSortedAndFilteredStations().map((station, index) => (
                <div
                  key={station.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedStation(station);
                    setViewMode('map');
                    setIsStationListVisible(false); // Hide list when viewing on map
                    if (map) {
                      map.panTo(station.location);
                      map.setZoom(15);
                    }
                  }}
                >
                  {/* Station details rendering */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <h3 className="font-medium text-lg">{station.name}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      station.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {station.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{station.address}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 font-medium">{station.rating?.toFixed(1)}</span> {/* Use optional chaining */}
                    <span className="text-gray-500 text-sm ml-1">
                      ({station.total_reviews} reviews)
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {/* Display distance if available */}
                      {station.distance !== undefined && (
                         <span className="text-sm font-medium">{`${(station.distance / 1000).toFixed(1)} km`}</span>
                      )}
                      {/* Display price if available */}
                      {station.price_per_kwh !== undefined && station.price_per_kwh > 0 && (
                         <span className="text-sm font-medium">${station.price_per_kwh}/kWh</span>
                      )}
                      {(station.distance !== undefined || (station.price_per_kwh !== undefined && station.price_per_kwh > 0)) && station.connectors.length > 0 && (
                         <span className="text-gray-400">•</span>
                      )}
                      <span className="text-sm text-gray-600">
                        {station.connectors.length} connector{station.connectors.length !== 1 ? 's' : ''}
                      </span>
                       {/* Display open status if available */}
                      {station.isOpen !== undefined && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${station.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {station.isOpen ? 'Open' : 'Closed'}
                        </span>
                      )}
                    </div>
                    <button
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStation(station);
                        setViewMode('map');
                        setIsStationListVisible(false); // Hide list when viewing on map
                        if (map) {
                          map.panTo(station.location);
                          map.setZoom(15);
                        }
                      }}
                    >
                      View on Map
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add a reset function for the Find Nearby button
  const handleFindNearby = useCallback(async () => { 
    setHasFoundStations(false);
    setStations([]);
    setIsStationListVisible(false); // Hide list when starting new search
    setViewMode('map'); // Switch to map view
    setLoading(true); // Start loading indicator
    // Do not reset search query on Find Nearby
    requestLocationPermission(); // Request location and trigger search
  }, [requestLocationPermission]);

  // Add a toggle function for the Show List / Hide List button
  const toggleStationListVisibility = useCallback(() => {
    // Only toggle if there are stations to show
    if (stations.length === 0) return; 
    setIsStationListVisible(prev => !prev);
    // When showing the list, ensure view mode is 'list'
    if (!isStationListVisible) {
        setViewMode('list');
    } else { // When hiding, go back to map view
        setViewMode('map');
    }
  }, [isStationListVisible, stations.length]); // Added stations.length to dependencies

  // Update search function to use search-specific location and correctly trigger list view
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !mapRef.current) {
      toast.error('Please enter a location to search');
      return;
    }

    try {
      setIsSearching(true);
      setLoading(true);
      setStations([]); // Clear existing stations before new search
      setHasFoundStations(false); // Reset found stations status
      setIsStationListVisible(false); // Hide list initially for new search
      setViewMode('map'); // Start with map view for new search

      // Create a geocoder instance
      const geocoder = new google.maps.Geocoder();
      
      // Geocode the search query to get coordinates
      const geocodeResult = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ 
          address: searchQuery,
          componentRestrictions: {
            country: 'IN' // Restrict to India
          }
        }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results);
          } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
            reject(new Error('Location not found. Please try a different search term.'));
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      if (!geocodeResult.length) {
        toast.error('Location not found. Please try a different search term.');
        setStations([]);
        setHasFoundStations(false);
        setIsStationListVisible(false);
        return;
      }

      const searchLocation = {
        lat: geocodeResult[0].geometry.location.lat(),
        lng: geocodeResult[0].geometry.location.lng()
      };

      // Update map center to the searched location
      if (mapRef.current) {
        mapRef.current.panTo(searchLocation);
        mapRef.current.setZoom(13); // Set an appropriate zoom level
      }

      // Search for stations near the searched location
      const placesService = new google.maps.places.PlacesService(mapRef.current);
      
      const results = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
        placesService.nearbySearch(
          {
            location: new google.maps.LatLng(searchLocation.lat, searchLocation.lng), // Use searchLocation
            radius: searchRadius,
            type: 'charging_station',
            keyword: 'electric vehicle charging station'
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results);
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              resolve([]);
            } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
              reject(new Error('API quota exceeded. Please try again later.'));
            } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) { 
              reject(new Error('Places API access denied. Please check your API key configuration.'));
            } else {
              reject(new Error(`Search failed: ${status}`));
            }
          }
        );
      });

      if (!results || results.length === 0) { // Ensure results is not null before checking length
        toast.error('No charging stations found in this area. Try a different location or increase the search radius.');
        setStations([]);
        setHasFoundStations(false);
        setIsStationListVisible(false); // Hide list on zero results
        return;
      }

      // Process the results and ensure required properties are present
      const formattedStations = await Promise.all(results.map(async (place) => {
        try {
          const details = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
            placesService.getDetails(
              { 
                placeId: place.place_id,
                fields: ['name', 'geometry', 'rating', 'user_ratings_total', 'vicinity', 'business_status', 'opening_hours']
              },
              (result, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(new Error(`Failed to get details for place: ${status}`));
                }
              }
            );
          });

          // Calculate distance from searched location
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(searchLocation.lat, searchLocation.lng), // Calculate distance from searchLocation
            new google.maps.LatLng(
              place.geometry?.location?.lat() || 0,
              place.geometry?.location?.lng() || 0
            )
          );

          return {
            id: place.place_id || Math.random().toString(),
            name: place.name || 'Unknown Station',
            location: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
            rating: place.rating || 0,
            total_reviews: place.user_ratings_total || 0,
            address: place.vicinity || 'Address not available',
            price_per_kwh: 0.40, // Default price - ensure this is always set
            available: place.business_status === 'OPERATIONAL', // Assuming OPERATIONAL means available
            distance: distance, // Add distance to the station object
            isOpen: details.opening_hours?.isOpen() || false, // Add isOpen property
            connectors: [], // Initialize with an empty array or fetch if available in details
          } as EVStation; // Cast to EVStation
        } catch (error) {
          console.error('Error processing station:', error);
          return null;
        }
      }));

      const validStations = formattedStations.filter(station => station !== null) as EVStation[]; // Filter out nulls and cast
      
      if (validStations.length > 0) {
        // Sort stations by distance
        validStations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setStations(validStations);
        setHasFoundStations(true);
        setIsStationListVisible(true); // Ensure list is visible
        setViewMode('list'); // Ensure view mode is list
        toast.success(`Found ${validStations.length} charging stations`);

        // Update map bounds to show all stations
        if (mapRef.current) {
          const bounds = new google.maps.LatLngBounds();
          validStations.forEach(station => {
            bounds.extend(new google.maps.LatLng(station.location.lat, station.location.lng));
          });
          mapRef.current.fitBounds(bounds);
        }
      } else { // Explicitly handle zero results after processing
         toast.error('No charging stations found in this area. Try a different location or increase the search radius.');
         setStations([]);
         setHasFoundStations(false);
         setIsStationListVisible(false); // Hide list on zero results
      }

    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to search for stations. Please try again.');
      }
      setStations([]);
      setHasFoundStations(false);
      setIsStationListVisible(false); // Hide list on error
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  }, [searchQuery, searchRadius]); // Added searchRadius to dependencies

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="flex flex-col items-center space-y-6 p-8 bg-white/10 rounded-xl backdrop-blur-sm">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-white">
              {isRetrying ? 'Retrying Location...' : 'Loading Map'}
            </h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-300">
                {isRetrying 
                  ? `Attempt ${retryCountRef.current + 1} of ${MAX_RETRIES}`
                  : 'Setting up your map view...'}
              </p>
              <p className="text-xs text-gray-400">
                {isRetrying ? 'Please wait while we try again' : 'This will only take a moment'}
              </p>
            </div>
          </div>
          <div className="w-full max-w-xs bg-gray-700 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={LIBRARIES}
      mapIds={[mapId]}
      onError={(error) => {
        console.error('Error loading Google Maps:', error);
        let errorMessage = 'Failed to load map. ';
        
        if (error.message.includes('API key')) {
          errorMessage += 'Please check your API key configuration. Make sure it has access to Maps JavaScript API and Places API.';
        } else if (error.message.includes('quota')) {
          errorMessage += 'API quota exceeded. Please try again later.';
        } else {
          errorMessage += 'Please check your internet connection.';
        }
        
        toast.error(errorMessage);
      }}
    >
      <div className="relative w-full h-full">
        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
          {/* Search Bar */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Distance Selector */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Radius
            </label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {radiusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Find Nearby Button */}
          <button
            onClick={handleFindNearby}
            className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md flex items-center space-x-2 hover:bg-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Find Nearby</span>
          </button>

          {/* Location Status and Show/Hide List Button */}
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              userLocation ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {userLocation ? 'Location Active' : 'Location Inactive'}
            </span>
            {stations.length > 0 && (
              <button
                onClick={toggleStationListVisibility}
                className="px-4 py-2 rounded-lg shadow-md flex items-center justify-center space-x-2 bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
              >
                <span>{isStationListVisible ? 'Hide List' : 'Show List'}</span>
                <span className="ml-1 text-xs font-semibold">({stations.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Render the station list */}
        {renderStationList()}

        {/* Map View */}
        <div className={`w-full h-full ${viewMode === 'list' ? 'hidden' : 'block'}`}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={10}
            onLoad={onMapLoad}
            onUnmount={() => {
              console.log('Map unmounted, cleaning up resources');
              Object.values(markersRef.current).forEach(marker => marker.map = null);
              markersRef.current = {};
              mapRef.current = null;
            }}
            options={{
              mapId: mapId,
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true
            }}
          >
            {userLocation && ( // Only show user location if available
              <>
                <Circle
                  center={userLocation}
                  radius={searchRadius}
                  options={{
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#FF0000',
                    fillOpacity: 0.1,
                  }}
                />
              </>
            )}

            {selectedStation && (
              <InfoWindow
                position={selectedStation.location}
                onCloseClick={() => setSelectedStation(null)}
              >
                {renderStationInfo(selectedStation)}
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </div>
    </LoadScript>
  );
};

export default MapComponent;