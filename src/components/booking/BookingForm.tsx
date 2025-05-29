import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Zap, CreditCard, Check, X, Car, Battery } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from '@/hooks/useAuth';
import { useCreateBooking } from '@/hooks/useBookings';
import { useStation } from '@/hooks/useStations';
import { toast } from 'sonner';

interface BookingFormProps {
  stationId: string;
  stationName?: string;
  price?: string;
  onBookingComplete?: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  stationId,
  stationName = "Charging Station",
  price = "$0.45",
  onBookingComplete
}) => {
  const { user } = useAuth();
  const createBooking = useCreateBooking();
  const { data: station } = useStation(stationId);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [vehicleType, setVehicleType] = useState('');
  const [chargerType, setChargerType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  
  // Generate time slots for the selected date
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 20;
    
    for (let hour = startHour; hour < endHour; hour++) {
      const time12h = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
      slots.push({ time: time12h, available: Math.random() > 0.3 });
      
      const halfHour12h = `${hour > 12 ? hour - 12 : hour}:30 ${hour >= 12 ? 'PM' : 'AM'}`;
      slots.push({ time: halfHour12h, available: Math.random() > 0.3 });
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const durations = [30, 60, 90, 120];
  const vehicleTypes = ['Tesla', 'Nissan Leaf', 'Chevrolet Bolt', 'BMW i3', 'Ford Mustang Mach-E', 'Other'];
  
  // Get available charger types from station data
  const availableChargerTypes = station?.connectors
    .filter(c => c.available)
    .map(c => c.connector_type) || [];
  const uniqueChargerTypes = [...new Set(availableChargerTypes)];

  // Calculate estimated cost based on duration and price
  const priceNumber = parseFloat(price?.replace('$', '') || '0.45');
  const estimatedCost = ((priceNumber * duration) / 60 * (vehicleType === 'Tesla' ? 9 : 7)).toFixed(2);
  
  const handleBookNow = async () => {
    if (!user) {
      toast.error("Please log in to make a booking");
      return;
    }

    if (!selectedDate || !selectedTime || !vehicleType || !chargerType) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Find the selected connector
    const selectedConnector = station?.connectors.find(
      c => c.connector_type === chargerType && c.available
    );
    
    if (!selectedConnector) {
      toast.error("Selected charger type is not available");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert time to 24h format for database
      const [time, period] = selectedTime.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      
      const startTime = `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
      const endHour = hour24 + Math.floor(duration / 60);
      const endMinute = parseInt(minutes) + (duration % 60);
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;
      
      await createBooking.mutateAsync({
        user_id: user.id,
        station_id: stationId,
        connector_id: selectedConnector.id,
        booking_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        duration_hours: duration / 60,
        total_price: parseFloat(estimatedCost),
        status: 'pending',
        special_requests: `Vehicle: ${vehicleType}`
      });
      
      setBookingStep(2);
      
      // Close dialog after confirmation
      setTimeout(() => {
        if (onBookingComplete) {
          onBookingComplete();
        }
      }, 3000);
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-white/70 mb-4">Please log in to make a booking</p>
        <Button 
          onClick={onBookingComplete}
          variant="outline"
          className="border-white/20 hover:bg-white/10 text-white"
        >
          Close
        </Button>
      </div>
    );
  }

  const renderStepIndicator = () => {
    return (
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= index ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {index + 1}
            </div>
            <span className="text-sm mt-2">{step.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 20
      }
    }
  };

  return (
    <motion.div 
      className="p-4 animate-fade-in"
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      {renderStepIndicator()}
      
      {bookingStep === 1 ? (
        <motion.div className="space-y-6">
          <motion.div variants={itemVariants}>
            <label className="block text-white mb-2 text-sm">Select Date</label>
            <div className="relative">
              <input 
                type="date" 
                className="glass-input w-full pl-10 bg-white/5 border border-white/10 rounded-lg p-3 text-white"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ev-blue" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-white mb-2 text-sm">Select Time</label>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot, index) => (
                <motion.button
                  key={index}
                  className={`p-2 rounded-lg text-sm transition-all ${
                    selectedTime === slot.time 
                      ? 'bg-ev-blue text-white' 
                      : slot.available 
                        ? 'bg-white/10 text-white hover:bg-white/20' 
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  whileHover={slot.available ? { scale: 1.02 } : {}}
                  whileTap={slot.available ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center justify-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {slot.time}
                  </div>
                  {!slot.available && (
                    <div className="text-[10px] text-red-400 mt-1">Unavailable</div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-white mb-2 text-sm">Vehicle Type</label>
            <Select onValueChange={setVehicleType} value={vehicleType}>
              <SelectTrigger className="glass-input bg-white/5 border border-white/10 text-white">
                <SelectValue placeholder="Select your vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-white mb-2 text-sm">Charger Type</label>
            <Select onValueChange={setChargerType} value={chargerType}>
              <SelectTrigger className="glass-input bg-white/5 border border-white/10 text-white">
                <SelectValue placeholder="Select charger type" />
              </SelectTrigger>
              <SelectContent>
                {uniqueChargerTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-white mb-2 text-sm">Session Duration</label>
            <div className="flex flex-wrap gap-2">
              {durations.map((mins) => (
                <motion.button
                  key={mins}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    duration === mins
                      ? 'bg-ev-blue text-white shadow-neon-blue' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  onClick={() => setDuration(mins)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {mins} min
                </motion.button>
              ))}
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 flex items-center">
                <Zap className="w-4 h-4 mr-1 text-ev-blue" /> Charging rate:
              </span>
              <span className="text-white">{price}/kWh</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 flex items-center">
                <Car className="w-4 h-4 mr-1 text-ev-blue" /> Vehicle:
              </span>
              <span className="text-white">{vehicleType || "Not selected"}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 flex items-center">
                <Battery className="w-4 h-4 mr-1 text-ev-blue" /> Charger:
              </span>
              <span className="text-white">{chargerType || "Not selected"}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70">Duration:</span>
              <span className="text-white">{duration} minutes</span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span className="text-white/70">Estimated cost:</span>
              <span className="text-white text-lg">${estimatedCost}</span>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button 
                      onClick={handleBookNow} 
                      className="w-full bg-blue-green-gradient hover:opacity-90 transition-all text-white rounded-full py-6 mt-4 shadow-neon-blue"
                      disabled={isSubmitting || !selectedDate || !selectedTime || !vehicleType || !chargerType}
                      aria-label="Confirm Booking"
                    >
                      {isSubmitting ? (
                        <motion.div
                          className="flex items-center justify-center"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        >
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </motion.div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <CreditCard className="mr-2" />
                          Confirm Booking
                        </div>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black/80 border-ev-blue/30">
                  {!selectedDate || !selectedTime || !vehicleType || !chargerType ? 
                    "Please fill in all required fields" : 
                    "Confirm your charging appointment"
                  }
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          className="flex flex-col items-center justify-center py-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <motion.div 
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6"
            animate={{ 
              boxShadow: ["0 0 0 0 rgba(74, 222, 128, 0)", "0 0 0 20px rgba(74, 222, 128, 0)"],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Check className="w-10 h-10 text-green-500" />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">Booking Confirmed!</h3>
          <p className="text-white/70 text-center mb-4">
            Your charging session has been scheduled for<br/>
            <span className="text-white">{selectedDate} at {selectedTime}</span>
          </p>
          
          <div className="bg-white/10 p-4 rounded-lg w-full mb-4">
            <h4 className="text-ev-blue font-medium mb-2">Booking Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Location:</span>
                <span className="text-white">{stationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Vehicle:</span>
                <span className="text-white">{vehicleType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Charger Type:</span>
                <span className="text-white">{chargerType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Duration:</span>
                <span className="text-white">{duration} minutes</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-white/70">Total Cost:</span>
                <span className="text-white">${estimatedCost}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-ev-blue/20 p-3 rounded-lg text-center w-full mb-4">
            <p className="text-white text-sm">
              <Zap className="inline-block h-4 w-4 mr-1" />
              Add this to your calendar for a reminder!
            </p>
          </div>
          
          <p className="text-ev-blue text-sm mb-4">
            A confirmation has been sent to your email
          </p>
          
          <Button 
            onClick={onBookingComplete} 
            variant="outline" 
            className="border-white/20 hover:bg-white/10 text-white"
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BookingForm;
