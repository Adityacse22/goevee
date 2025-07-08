import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import StationList from '../components/stations/StationList';
import BookingForm from '../components/booking/BookingForm';
import SearchBar from '../components/ui/SearchBar';
import LocationButton from '../components/ui/LocationButton';

const Booking = () => {
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [selectedStationName, setSelectedStationName] = useState<string>('');
  const [showBookingForm, setShowBookingForm] = useState(false);

  const handleStationSelect = (stationId: string, stationName: string) => {
    setSelectedStationId(stationId);
    setSelectedStationName(stationName);
    setShowBookingForm(true);
  };

  const handleBookingComplete = () => {
    setShowBookingForm(false);
    setSelectedStationId('');
    setSelectedStationName('');
  };

  return (
    <div className="min-h-screen w-full pb-0 overflow-x-hidden">
      <Navbar hasScrolled={true} />
      
      <main className="container pt-24 px-4">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-center gradient-text mb-4">
            Book Your EV Charging
          </h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Find and book charging stations near you. Select a station to get started with your booking.
          </p>
        </motion.div>

        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <SearchBar />
        </motion.div>
        
        <motion.div 
          className="mb-6 flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <LocationButton />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div 
            className="glass-card p-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-white">Available Stations</h2>
            <StationList onStationSelect={handleStationSelect} />
          </motion.div>

          <motion.div 
            className="glass-card p-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {showBookingForm && selectedStationId ? (
              <BookingForm 
                stationId={selectedStationId}
                stationName={selectedStationName}
                price="$0.45"
                onBookingComplete={handleBookingComplete}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <motion.div
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </motion.div>
                  <h3 className="text-lg font-medium text-white mb-2">Select a Station</h3>
                  <p className="text-muted-foreground">
                    Choose a charging station from the list to start your booking
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Booking;