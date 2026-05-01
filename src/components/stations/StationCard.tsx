import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Zap } from 'lucide-react';

interface StationCardProps {
  station: {
    id: string;
    name: string;
    address: string;
    rating: number;
    total_reviews: number;
    price_per_kwh: number;
    available: boolean;
    connectors: Array<{ power_output: number; connector_type: string }>;
  };
  onBook: () => void;
}

const StationCard: React.FC<StationCardProps> = ({ station, onBook }) => {
  const maxSpeed = station.connectors?.length 
    ? Math.max(...station.connectors.map(c => c.power_output)) 
    : 0;

  return (
    <motion.div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{station.name}</h3>
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mt-1">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            <span className="truncate max-w-[180px]">{station.address}</span>
          </div>
          
          <div className="flex items-center mt-3 gap-3">
            <div className="flex items-center">
              <Star className="w-3.5 h-3.5 text-yellow-500 mr-1 fill-yellow-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">{station.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs">
              <Zap className="w-3.5 h-3.5 mr-1 text-ev-blue" />
              <span>{maxSpeed} kW</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-slate-900 dark:text-white font-bold">
              ₹{station.price_per_kwh}<span className="text-[10px] text-slate-500 font-normal">/kWh</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBook();
              }}
              disabled={!station.available}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                station.available
                  ? 'bg-ev-blue text-white hover:bg-ev-blue/90 shadow-lg shadow-ev-blue/20'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
              }`}
            >
              {station.available ? 'Book Now' : 'Occupied'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StationCard;
