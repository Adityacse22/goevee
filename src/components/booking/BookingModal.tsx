import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Zap, Calendar, Clock, CreditCard } from 'lucide-react';
import { MockStation } from '@/data/mockStations';

interface BookingModalProps {
  isOpen: boolean;
  station: any | null;
  onClose: () => void;
  onConfirm: (booking: BookingDetails) => void;
}

export interface BookingDetails {
  stationId: string;
  stationName: string;
  date: string;
  timeSlot: string;
  duration: number;
  connectorType: string;
  estimatedCost: number;
}

const timeSlots = [
  { label: '6:00 AM', value: '06:00' },
  { label: '8:00 AM', value: '08:00' },
  { label: '10:00 AM', value: '10:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '2:00 PM', value: '14:00' },
  { label: '4:00 PM', value: '16:00' },
  { label: '6:00 PM', value: '18:00' },
  { label: '8:00 PM', value: '20:00' },
  { label: '10:00 PM', value: '22:00' },
];

const durations = [
  { label: '30 min', value: 0.5 },
  { label: '1 hour', value: 1 },
  { label: '2 hours', value: 2 },
  { label: '3 hours', value: 3 },
];

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, station, onClose, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [selectedConnector, setSelectedConnector] = useState('');

  if (!station) return null;

  const availableConnectors = station.connectors?.filter((c: any) => c.available) || [];
  const activeConnector = availableConnectors.find((c: any) => (c.connector_type || c.type) === selectedConnector) || availableConnectors[0];
  const estimatedKwh = activeConnector ? (activeConnector.power_output || activeConnector.power || 50) * selectedDuration * 0.8 : 0;
  const price = station.price_per_kwh || station.pricePerKwh || 14;
  const estimatedCost = estimatedKwh * price;

  const handleConfirm = () => {
    if (!selectedTime) return;
    onConfirm({
      stationId: station.id,
      stationName: station.name,
      date: selectedDate,
      timeSlot: selectedTime,
      duration: selectedDuration,
      connectorType: selectedConnector || activeConnector?.connector_type || activeConnector?.type || '',
      estimatedCost,
    });
  };

  const isValid = selectedTime && selectedDate;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="booking-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">Book Charging Slot</h2>
                <p className="text-white/50 text-sm mt-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-ev-blue" />
                  {station.name}
                </p>
              </div>
              <motion.button
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Station info */}
            <div className="bg-white/5 rounded-xl p-3.5 mb-5 border border-white/5">
              <p className="text-white/40 text-xs flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                {station.address}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                <span>₹{price}/kWh</span>
                <span>·</span>
                <span>{station.distance ? station.distance.toFixed(1) : '1.2'} km away</span>
                <span>·</span>
                <span className="text-green-400">Available</span>
              </div>
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="booking-label">
                <Calendar className="w-3.5 h-3.5" />
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="booking-input"
              />
            </div>

            {/* Time Slots */}
            <div className="mb-4">
              <label className="booking-label">
                <Clock className="w-3.5 h-3.5" />
                Time Slot
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <motion.button
                    key={slot.value}
                    className={`time-slot-btn ${selectedTime === slot.value ? 'time-slot-active' : ''}`}
                    onClick={() => setSelectedTime(slot.value)}
                    whileTap={{ scale: 0.95 }}
                  >
                    {slot.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="booking-label">Duration</label>
              <div className="flex gap-2">
                {durations.map((d) => (
                  <motion.button
                    key={d.value}
                    className={`time-slot-btn flex-1 ${selectedDuration === d.value ? 'time-slot-active' : ''}`}
                    onClick={() => setSelectedDuration(d.value)}
                    whileTap={{ scale: 0.95 }}
                  >
                    {d.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Connector type */}
            {availableConnectors.length > 0 && (
              <div className="mb-5">
                <label className="booking-label">
                  <Zap className="w-3.5 h-3.5" />
                  Connector
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableConnectors.map((c, i) => (
                    <motion.button
                      key={i}
                      className={`time-slot-btn ${
                        (selectedConnector === (c.connector_type || c.type) || (!selectedConnector && i === 0))
                          ? 'time-slot-active'
                          : ''
                      }`}
                      onClick={() => setSelectedConnector(c.connector_type || c.type)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {c.connector_type || c.type} · {c.power_output || c.power}kW
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated cost */}
            <div className="bg-gradient-to-r from-ev-blue/10 to-ev-green/10 rounded-xl p-4 mb-5 border border-ev-blue/20">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  Estimated Cost
                </span>
                <span className="text-2xl font-bold gradient-text">
                  ₹{estimatedCost.toFixed(0)}
                </span>
              </div>
              <p className="text-white/30 text-xs mt-1">
                ~{estimatedKwh.toFixed(1)} kWh · {selectedDuration}h session
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors"
                onClick={onClose}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-ev-blue to-ev-green text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleConfirm}
                disabled={!isValid}
                whileHover={isValid ? { scale: 1.02 } : {}}
                whileTap={isValid ? { scale: 0.98 } : {}}
              >
                Confirm Booking
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
