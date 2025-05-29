import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StationCard from './StationCard';
import { useStations } from '@/hooks/useStations';
import { Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';

interface Location {
  lat: number;
  lng: number;
}

interface EVStation {
  id: string;
  name: string;
  location: Location;
  available: boolean;
  rating: number;
  total_reviews: number;
  address: string;
  price_per_kwh: number;
}

interface BookingTime {
  startTime: string;
  duration: number;
}

const StationList: React.FC = () => {
  const { data: stations, isLoading, error } = useStations();
  const [visibleStations, setVisibleStations] = useState<EVStation[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [searchRadius, setSearchRadius] = useState(5000); // 5km radius
  const [selectedTime, setSelectedTime] = useState<BookingTime>({
    startTime: new Date().toISOString().slice(0, 16),
    duration: 2
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          filterNearbyStations(newLocation, stations || []);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Please enable location services to find nearby stations');
        }
      );
    }
  }, [stations]);

  const filterNearbyStations = (location: Location, allStations: any[]) => {
    const nearbyStations = allStations
      .map(station => ({
        ...station,
        location: {
          lat: station.latitude,
          lng: station.longitude
        }
      }))
      .filter(station => {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          station.location.lat,
          station.location.lng
        );
        return distance <= searchRadius / 1000; // Convert radius to km
      })
      .sort((a, b) => b.rating - a.rating);

    setVisibleStations(nearbyStations);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const handleBooking = async (stationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to book a station');
        return;
      }

      const startTime = new Date(selectedTime.startTime);
      const endTime = new Date(startTime.getTime() + selectedTime.duration * 60 * 60 * 1000);

      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            station_id: stationId,
            user_id: user.id,
            status: 'pending',
            booking_date: startTime.toISOString().split('T')[0],
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_hours: selectedTime.duration,
            total_price: 0,
            special_requests: ''
          }
        ]);

      if (error) throw error;
      toast.success('Booking successful!');
      if (userLocation) {
        filterNearbyStations(userLocation, stations || []);
      }
    } catch (error) {
      console.error('Error booking station:', error);
      toast.error('Failed to book station');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
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
          <p>Error loading stations: {error.message}</p>
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

      {/* Time Selection */}
      <motion.div 
        className="mb-4 flex gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex-1">
          <label className="block text-sm text-white/70 mb-1">Start Time</label>
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
          <label className="block text-sm text-white/70 mb-1">Duration (hours)</label>
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
              onBook={() => handleBooking(station.id)}
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
          No charging stations found nearby
        </motion.div>
      )}
    </div>
  );
};

export default StationList;
