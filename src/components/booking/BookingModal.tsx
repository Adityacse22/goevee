import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  Clock, 
  Zap, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Leaf,
  Calendar
} from 'lucide-react';
import type { EVStation } from '@/models/station.model';
import { format, addDays, isSameDay } from 'date-fns';
import { formatDistance } from '@/utils/formatting';

export interface BookingDetails {
  stationId: string;
  stationName: string;
  date: string;
  timeSlot: string;
  duration: number; // in hours
  connectorType: string;
  estimatedCost: number;
}

interface BookingModalProps {
  isOpen: boolean;
  station: EVStation | null;
  onClose: () => void;
  onConfirm: (details: BookingDetails) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  station,
  onClose,
  onConfirm,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('10:00 PM');
  const [duration, setDuration] = useState(1); // 1 hour
  const [selectedConnector, setSelectedConnector] = useState<string>('');

  // Update selected connector when station changes
  React.useEffect(() => {
    if (station?.connectors && station.connectors.length > 0 && station.connectors[0]) {
      setSelectedConnector(station.connectors[0].id);
    }
  }, [station]);

  // Generate 7 days starting from today
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  }, []);

  const timeSlots = [
    '6:00 AM', '8:00 AM', '10:00 AM',
    '12:00 PM', '2:00 PM', '4:00 PM',
    '6:00 PM', '8:00 PM', '10:00 PM'
  ];

  const durations = [
    { label: '30 min', value: 0.5 },
    { label: '1 hour', value: 1 },
    { label: '2 hours', value: 2 },
    { label: '3 hours', value: 3 }
  ];

  const pricePerKwh = station?.price_per_kwh || 15; 
  const kwhPerHour = 15; // Estimated consumption for calculation
  const totalKwh = duration * kwhPerHour;
  const totalPrice = Math.round(totalKwh * pricePerKwh);

  if (!station) return null;

  const handleConfirm = () => {
    // Convert 12h time (e.g., "10:00 PM") to 24h time (e.g., "22:00:00")
    const convertTo24Hour = (time12h: string) => {
      const [time, period] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      return `${hour.toString().padStart(2, '0')}:${minutes}:00`;
    };

    onConfirm({
      stationId: station.id,
      stationName: station.name,
      date: format(selectedDate, 'yyyy-MM-dd'),
      timeSlot: convertTo24Hour(selectedTime),
      duration,
      connectorType: station.connectors?.find(c => c.id === selectedConnector)?.connector_type || 'CCS2',
      estimatedCost: totalPrice
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-slate-900 border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5 text-ev-blue fill-ev-blue/20" />
                  Book Charging Slot
                </h2>
                <p className="text-xs text-white/50">{station.name}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              {/* Station Info Card */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="mt-1 p-2 rounded-lg bg-ev-blue/10">
                      <MapPin className="w-5 h-5 text-ev-blue" />
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed max-w-[70%]">
                      {station.address}
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-ev-green/10 border border-ev-green/20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-ev-green animate-pulse" />
                    <span className="text-[10px] font-bold text-ev-green uppercase tracking-wider">Available</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                    <div className="p-1.5 rounded-full bg-ev-blue/10 text-ev-blue">
                      <CreditCard className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-white">₹{pricePerKwh}/kWh</span>
                    <span className="text-[10px] text-white/40 uppercase">Price</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                    <div className="p-1.5 rounded-full bg-ev-blue/10 text-ev-blue">
                      <MapPin className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-white">{formatDistance(station.distance)}</span>
                    <span className="text-[10px] text-white/40 uppercase">Away</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                    <div className="p-1.5 rounded-full bg-ev-blue/10 text-ev-blue">
                      <Zap className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-white">CCS2 • 50kW</span>
                    <span className="text-[10px] text-white/40 uppercase">Connector</span>
                  </div>
                </div>
              </div>

              {/* Date Selector */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Date</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {dates.map((date, i) => {
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`flex-shrink-0 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                          isSelected 
                            ? 'bg-ev-blue/20 border-ev-blue text-ev-blue shadow-[0_0_15px_rgba(45,212,191,0.2)]' 
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'MMM d')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Time Slot</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                          isSelected 
                            ? 'bg-ev-blue/20 border-ev-blue text-ev-blue shadow-[0_0_15px_rgba(45,212,191,0.2)]' 
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {time}
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Segmented Control */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Duration</span>
                </div>
                <div className="p-1 bg-white/5 rounded-xl border border-white/10 flex">
                  {durations.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        duration === d.value 
                          ? 'bg-slate-700 text-white shadow-lg' 
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Connectors & Eco Credits */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/60">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Connector</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-ev-green/10 border border-ev-green/20 flex items-center gap-2">
                    <Leaf className="w-3 h-3 text-ev-green" />
                    <span className="text-[10px] font-bold text-ev-green uppercase">Earn 20 Eco Credits</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  {(station.connectors && station.connectors.length > 0) ? station.connectors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConnector(c.id)}
                      className={`px-4 py-3 rounded-xl border flex items-center gap-3 transition-all ${
                        selectedConnector === c.id 
                          ? 'bg-ev-blue/20 border-ev-blue text-white' 
                          : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <Zap className={`w-4 h-4 ${selectedConnector === c.id ? 'text-ev-blue' : 'text-white/40'}`} />
                      <span className="text-xs font-bold">{c.connector_type} • {c.power_output}kW</span>
                    </button>
                  )) : (
                    <div className="px-4 py-3 rounded-xl border bg-white/5 border-white/10 text-white/40">
                      <span className="text-xs font-bold">Standard CCS2 • 50kW</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Summary</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <Zap className="w-3 h-3" />
                        <span className="text-[10px] uppercase font-bold">{totalKwh.toFixed(1)} kWh</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/40">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] uppercase font-bold">{duration >= 1 ? `${duration} hour` : '30 min'} session</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-white">₹{totalPrice}</p>
                    <p className="text-[10px] text-white/40 uppercase font-bold">Incl. taxes</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/5">
                  <ShieldCheck className="w-3 h-3 text-white/30" />
                  <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">No Hidden Fees | Price Verified</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-slate-900 border-t border-white/5 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-ev-blue to-ev-green text-slate-950 font-bold hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all flex items-center justify-center gap-3 group"
              >
                Book Now
                <div className="p-1.5 rounded-lg bg-slate-950/10 group-hover:bg-slate-950/20 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
