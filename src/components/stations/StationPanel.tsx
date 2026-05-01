import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Zap, Star, Clock, ChevronRight } from 'lucide-react';
import type { EVStation } from '@/models/station.model';
import { formatDistance } from '@/utils/formatting';

interface StationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  stations: EVStation[];
  onBookStation: (station: EVStation) => void;
  onStationHover?: (stationId: string | null) => void;
  onStationClick?: (station: EVStation) => void;
  highlightedStationId?: string | null;
}

function formatStationDistance(distance?: number) {
  if (distance == null) {
    return 'Distance unavailable';
  }

  return distance < 1000
    ? `${Math.round(distance)} m`
    : `${(distance / 1000).toFixed(1)} km`;
}

const StationPanel: React.FC<StationPanelProps> = ({
  isOpen,
  onClose,
  stations,
  onBookStation,
  onStationHover,
  onStationClick,
  highlightedStationId,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted station when map marker is clicked
  useEffect(() => {
    if (highlightedStationId && listRef.current) {
      const el = listRef.current.querySelector(`[data-station-id="${highlightedStationId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedStationId]);

  const availableCount = stations.filter(s => s.available).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="station-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="station-panel-header">
              <div>
                <h2 className="text-lg font-bold text-white">Nearby Stations</h2>
                <p className="text-sm text-white/50 mt-0.5">
                  {stations.length} found · {availableCount} available
                </p>
              </div>
              <motion.button
                className="station-panel-close"
                onClick={onClose}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Station List */}
            <div className="station-panel-list" ref={listRef}>
              {stations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-white/40">
                  <MapPin className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No stations found nearby</p>
                  <p className="text-xs mt-1">Try increasing the search radius</p>
                </div>
              ) : (
                stations.map((station, index) => (
                  <motion.div
                    key={station.id}
                    data-station-id={station.id}
                    className={`station-card ${highlightedStationId === station.id ? 'station-card-highlighted' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onMouseEnter={() => onStationHover?.(station.id)}
                    onMouseLeave={() => onStationHover?.(null)}
                    onClick={() => onStationClick?.(station)}
                  >
                    {/* Top row: Name + Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-white font-semibold text-sm leading-tight flex-1">
                        {station.name}
                      </h3>
                      <span className={`status-badge ${station.available ? 'status-available' : 'status-busy'}`}>
                        {station.available ? 'Available' : 'Busy'}
                      </span>
                    </div>

                    {/* Address */}
                    <p className="text-white/40 text-xs mb-2.5 leading-relaxed">
                      <MapPin className="w-3 h-3 inline mr-1 relative -top-px" />
                      {station.address}
                    </p>

                    {/* Info row */}
                    <div className="flex items-center gap-3 mb-3 text-xs">
                      <span className="text-white/60 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 text-ev-blue" />
                        {formatStationDistance(station.distance)}
                      </span>
                      <span className="text-white/60 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        {station.rating || '4.5'} ({station.total_reviews || 0})
                      </span>
                      <span className="text-white/60 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-ev-green" />
                        ₹{station.price_per_kwh || 14}/kWh
                      </span>
                      {station.isOpen && (
                        <span className="text-green-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Open
                        </span>
                      )}
                    </div>

                    {/* Connectors */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {station.connectors?.map((connector, index) => (
                        <span
                          key={index}
                          className={`connector-badge ${connector.available ? 'connector-available' : 'connector-unavailable'}`}
                        >
                          {connector.connector_type} · {connector.power_output}kW
                        </span>
                      ))}
                    </div>

                    {/* Book Now button */}
                    <motion.button
                      className="book-now-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookStation(station);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!station.available}
                    >
                      {station.available ? 'Book Now' : 'Unavailable'}
                    </motion.button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StationPanel;
