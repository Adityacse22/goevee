import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LocationButton from '../components/ui/LocationButton';
import SearchBar from '../components/SearchBar';
import HeroSection from '../components/ui/HeroSection';
import MapComponent from '../components/Map';
import StationPanel from '../components/stations/StationPanel';
import BookingModal from '../components/booking/BookingModal';
import { BookingDetails } from '../components/booking/BookingModal';
import toast from 'react-hot-toast';
import { MapErrorBoundary } from '../components/MapErrorBoundary';
import { useAuth } from '@/controllers/useAuth';
import { useCreateBooking } from '@/controllers/useBookings';
import type { EVStation } from '@/models/station.model';
import { containerVariants, itemVariants } from '@/config/animations';

const Index = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<EVStation | null>(null);
  const [highlightedStationId, setHighlightedStationId] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user } = useAuth();

  // Live Search States
  const [isSearching, setIsSearching] = useState(false);
  const [liveStations, setLiveStations] = useState<EVStation[]>([]);
  
  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const createBooking = useCreateBooking();
  
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleBookStation = (station: EVStation) => {
    if (!user) {
      toast.error('Please log in to book a station');
      return;
    }
    setSelectedStation(station);
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = (booking: BookingDetails) => {
    createBooking.mutate({
      connector_id: booking.stationId, // Using stationId as a fallback for now, needs to be a real chargerId
      booking_date: booking.date,
      start_time: booking.timeSlot,
      end_time: String(Number(booking.timeSlot.split(':')[0]) + booking.duration).padStart(2, '0') + ':00',
      total_price: booking.estimatedCost,
      status: 'confirmed',
      user_id: user?.id || '',
      station_id: booking.stationId,
      duration_hours: booking.duration,
    }, {
      onSuccess: () => {
        setIsBookingOpen(false);
        setSelectedStation(null);
      }
    });
  };

  const handleStationHover = (stationId: string | null) => {
    setHighlightedStationId(stationId);
  };

  const handleStationClick = (station: EVStation) => {
    setHighlightedStationId(station.id);
  };




  return (
    <div className="min-h-screen w-full pb-0 overflow-x-hidden">
      <Navbar 
        hasScrolled={hasScrolled}
      />
      
      {/* Hero Section */}
      <HeroSection />
      
      <motion.main 
        className="container pt-24 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="mb-6 flex items-center justify-center gap-4"
          variants={itemVariants}
        >
          <LocationButton />
          <motion.button
            className="glass-button py-2 px-4"
            onClick={togglePanel}
            whileTap={{ scale: 0.95 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 20px rgba(30, 174, 219, 0.6)"
            }}
          >
            {isPanelOpen ? "Hide List" : "Show List"}
          </motion.button>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 gap-6"
          variants={itemVariants}
        >
          {/* Map is always visible and isolated from Auth failures */}
          <motion.div 
            className="glass-card p-5 h-[600px]"
            whileHover={{ 
              boxShadow: "0 0 22px rgba(30, 174, 219, 0.35)",
              transition: { type: "spring", stiffness: 300, damping: 22 }
            }}
          >
            <MapErrorBoundary>
              <MapComponent 
                onStationsUpdate={setLiveStations}
                onSearchingChange={setIsSearching}
                onHighlightedStationChange={setHighlightedStationId}
                onBookStation={handleBookStation}
              />
            </MapErrorBoundary>
          </motion.div>
        </motion.div>
      </motion.main>

      {/* Footer */}
      <Footer />

      {/* Station Side Panel — overlays on top of map */}
      <StationPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        stations={liveStations}
        onBookStation={handleBookStation}
        onStationHover={handleStationHover}
        onStationClick={handleStationClick}
        highlightedStationId={highlightedStationId}
      />

      {/* Booking Modal - Only rendered if user exists, otherwise login required logic applied in StationPanel */}
      {user && (
        <BookingModal
          isOpen={isBookingOpen}
          station={selectedStation}
          onClose={() => {
            setIsBookingOpen(false);
            setSelectedStation(null);
          }}
          onConfirm={handleConfirmBooking}
        />
      )}
    </div>
  );
};

export default Index;
