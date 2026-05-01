import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import StationCard from './StationCard';
import { useStations } from '@/controllers/useStations';
import { Loader2, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { calculateDistance } from '@/utils/geo';
import type { StationWithConnectors } from '@/models/station.model';

interface StationListProps {
  onStationSelect?: (stationId: string, stationName: string) => void;
}

// We map the database StationWithConnectors to a simpler UI shape used by cards
interface UIStation {
  id: string;
  name: string;
  address: string;
  rating: number;
  total_reviews: number;
  price_per_kwh: number;
  available: boolean;
  latitude: number;
  longitude: number;
}

interface Location {
  lat: number;
  lng: number;
}

const StationList: React.FC<StationListProps> = ({ onStationSelect }) => {
  const { data: stations, isLoading, error } = useStations();
  const [visibleStations, setVisibleStations] = useState<UIStation[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [searchRadius] = useState(5000); // 5km radius

  // Keeping Time Selection visually but not managing insertion here
  const [selectedTime, setSelectedTime] = useState({
    startTime: new Date().toISOString().slice(0, 16),
    duration: 2
  });

  const filterNearbyStations = useCallback((
    location: Location, 
    allStations: StationWithConnectors[]
  ) => {
    const nearbyStations = allStations
      .map(station => ({
        id: station.id,
        name: station.name,
        address: station.address || 'Unknown address',
        rating: station.rating || 4.5,
        total_reviews: station.total_reviews || 0,
        price_per_kwh: station.price_per_kwh || 14,
        available: station.available !== false,
        latitude: station.latitude,
        longitude: station.longitude,
      }))
      .filter(station => {
        if (station.latitude == null || station.longitude == null) return false;
        const distance = calculateDistance(
          location.lat,
          location.lng,
          station.latitude,
          station.longitude
        );
        return distance <= searchRadius / 1000; // Convert radius to km
      })
      .sort((a, b) => b.rating - a.rating);

    setVisibleStations(nearbyStations);
  }, [searchRadius]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          if (stations) {
            filterNearbyStations(newLocation, stations);
          }
        },
        (err: GeolocationPositionError) => {
          console.error('Error getting location:', err);
          const GEO_ERRORS: Record<number, string> = {
            1: 'Location access denied. Please allow location in your browser settings.',
            2: 'Your position is unavailable. Check device GPS or Wi-Fi.',
            3: 'Location request timed out. Please try again.',
          };
          toast.error(GEO_ERRORS[err.code] ?? 'Please enable location services to find nearby stations');
          // Fallback: show all stations when location is unavailable
          if (stations) {
            filterNearbyStations({ lat: 0, lng: 0 }, stations);
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
      );
    } else if (stations) {
      filterNearbyStations({ lat: 0, lng: 0 }, stations);
    }
  }, [filterNearbyStations, stations]);

  const handleBookingClick = (stationId: string, stationName: string) => {
    if (onStationSelect) {
      onStationSelect(stationId, stationName);
    } else {
      console.warn('onStationSelect prop is missing in StationList');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2 text-white"
        >
          <Loader2 className="h-6 w-6 animate-spin text-ev-blue" />
          <span>Loading charging stations...</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400"
        >
          <p>Error loading stations: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <p className="text-sm text-white/50 mt-2">Please try refreshing the page</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <motion.div 
        className="flex justify-between items-center mb-4"
        variants={itemVariants}
      >
        <motion.h2 
          className="text-xl font-semibold text-white"
          whileHover={{ scale: 1.05, x: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          Nearby Stations
        </motion.h2>
        <motion.span 
          className="text-white/70 text-sm"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {visibleStations.length} stations found
        </motion.span>
      </motion.div>

      {/* Time Selection Display (Information only) */}
      <motion.div 
        className="mb-4 flex gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex-1">
          <label className="block text-sm text-white/70 mb-1">Start Time Target</label>
          <div className="relative">
            <input
              type="datetime-local"
              value={selectedTime.startTime}
              onChange={(e) => setSelectedTime(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-ev-blue"
            />
            <Clock className="absolute left-3 top-2.5 h-5 w-5 text-white/50" />
          </div>
        </div>
        <div className="w-32">
          <label className="block text-sm text-white/70 mb-1">Duration Focus</label>
          <select
            value={selectedTime.duration}
            onChange={(e) => setSelectedTime(prev => ({ ...prev, duration: Number(e.target.value) }))}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-ev-blue"
          >
            <option value="1">1 hour</option>
            <option value="2">2 hours</option>
            <option value="3">3 hours</option>
            <option value="4">4 hours</option>
          </select>
        </div>
      </motion.div>
      
      <motion.div 
        className="mt-4 flex gap-4 overflow-x-auto pb-4 custom-scrollbar"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {visibleStations.map((station) => (
          <motion.div 
            key={station.id} 
            variants={itemVariants}
            className="min-w-[300px]"
          >
            <StationCard
              station={station}
              onBook={() => handleBookingClick(station.id, station.name)}
            />
          </motion.div>
        ))}
      </motion.div>
      
      {visibleStations.length === 0 && (
        <motion.div
          className="mt-6 text-center text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          No charging stations found near your location.
        </motion.div>
      )}
    </div>
  );
};

export default StationList;
