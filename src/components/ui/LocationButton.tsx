import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useSearch } from '@/controllers/useSearchController';

const LocationButton: React.FC = () => {
  const [showRipple, setShowRipple] = useState(false);
  const { requestCurrentLocation, locationStatus } = useSearch();
  const isActivated = locationStatus === 'active';
  const isLoading = locationStatus === 'loading';
  
  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    requestCurrentLocation();
  };

  React.useEffect(() => {
    if (!isActivated) {
      return;
    }

    toast.success("Location successfully detected!");
    setShowRipple(true);

    const timeoutId = window.setTimeout(() => {
      setShowRipple(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [isActivated]);

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay: 0.3
      }}
    >
      <Button 
        className={`glass-button flex items-center gap-2 px-6 py-3 ${isActivated ? "" : "animate-pulse-glow"}`}
        onClick={handleLocationClick}
        disabled={isLoading}
      >
        <motion.div
          animate={isActivated ? {
            scale: [1, 1.3, 1],
            transition: { 
              duration: 0.5,
              times: [0, 0.2, 0.5]
            }
          } : {}}
        >
          <MapPin className={`h-5 w-5 ${isActivated ? "text-ev-green" : "text-white"}`} />
        </motion.div>
        
        <span className={`${isActivated ? "text-ev-green" : "text-white"}`}>
          {isLoading ? "Detecting..." : isActivated ? "Location Active" : "Use My Location"}
        </span>
        
        {/* Success checkmark for activated state */}
        <AnimatePresence>
          {isActivated && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 10 }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-ev-green text-white rounded-full flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
      
      {/* Ripple effect when location is activated */}
      <AnimatePresence>
        {showRipple && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-ev-green/20"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-ev-green/30"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Loading animation */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LocationButton;
