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
  };
  onBook: () => void;
}

const StationCard: React.FC<StationCardProps> = ({ station, onBook }) => {
  return (
    <motion.div
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{station.name}</h3>
          <div className="flex items-center text-gray-600 text-sm mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{station.address}</span>
          </div>
          <div className="flex items-center mt-2">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="font-medium">{station.rating.toFixed(1)}</span>
            <span className="text-gray-500 text-sm ml-1">
              ({station.total_reviews} reviews)
            </span>
          </div>
          <div className="flex items-center mt-2 text-gray-600">
            <Zap className="w-4 h-4 mr-1" />
            <span>₹{station.price_per_kwh}/kWh</span>
          </div>
        </div>
        <div className="flex flex-col items-end ml-4">
          <span
            className={`px-2 py-1 rounded text-sm ${
              station.available
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {station.available ? 'Available' : 'Occupied'}
          </span>
          {station.available && (
            <button
              onClick={onBook}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StationCard;
