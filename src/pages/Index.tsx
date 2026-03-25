import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LocationButton from '../components/ui/LocationButton';
import SearchBar from '../components/ui/SearchBar';
import HeroSection from '../components/ui/HeroSection';
import MapComponent from '../components/Map';
import StationPanel from '../components/stations/StationPanel';
import BookingModal from '../components/booking/BookingModal';
import { mockStations, MockStation } from '@/data/mockStations';
import { BookingDetails } from '../components/booking/BookingModal';
import toast from 'react-hot-toast';
import { MapErrorBoundary } from '../components/MapErrorBoundary';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<MockStation | any>(null);
  const [highlightedStationId, setHighlightedStationId] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user, loading } = useAuth();
  
  useEffect(() => {
    console.log('5. Supabase session loading:', loading);
    console.log('6. Supabase user:', user);
    console.log('7. isLoading blocks map render:', 'no, Map is safely decoupled');
  }, [loading, user]);

  // Live Search States
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [triggerSearch, setTriggerSearch] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [liveStations, setLiveStations] = useState<any[]>([]);
  
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
  
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleSearchSubmit = () => {
    if (globalSearchQuery.trim()) {
      setTriggerSearch(Date.now());
      setIsPanelOpen(true); // Auto-open panel on search
    }
  };

  const handleBookStation = (station: any) => {
    setSelectedStation(station);
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = (booking: BookingDetails) => {
    toast.success(`Booking confirmed at ${booking.stationName}! 🎉`);
    setIsBookingOpen(false);
    setSelectedStation(null);
  };

  const handleStationHover = (stationId: string | null) => {
    setHighlightedStationId(stationId);
  };

  const handleStationClick = (station: any) => {
    setHighlightedStationId(station.id);
  };

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        damping: 12
      }
    }
  };

  return (
    <div className="min-h-screen w-full pb-0 overflow-x-hidden">
      <Navbar 
        hasScrolled={hasScrolled} 
        searchQuery={globalSearchQuery}
        onSearchChange={setGlobalSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        isSearching={isSearching}
      />
      
      {/* Hero Section */}
      <HeroSection />
      
      <motion.main 
        className="container pt-24 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-6 md:hidden" variants={itemVariants}>
          <SearchBar 
            value={globalSearchQuery}
            onChange={setGlobalSearchQuery}
            onSubmit={handleSearchSubmit}
            isLoading={isSearching}
          />
        </motion.div>
        
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
              scale: 1.02,
              boxShadow: "0 0 25px rgba(30, 174, 219, 0.5)",
              transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
          >
            <MapErrorBoundary>
              <MapComponent 
                externalSearchQuery={globalSearchQuery}
                triggerSearch={triggerSearch}
                onStationsUpdate={setLiveStations}
                onSearchingChange={setIsSearching}
                onHighlightedStationChange={setHighlightedStationId}
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
