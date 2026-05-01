/**
 * VIEW — Booking confirmation card.
 * Extracted from BookingForm.tsx (lines 370-437).
 * Pure presentation — all data passed via props.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingConfirmationProps {
  stationName: string;
  selectedDate: string;
  selectedTime: string;
  vehicleType: string;
  chargerType: string;
  duration: number;
  estimatedCost: string;
  onClose?: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  stationName,
  selectedDate,
  selectedTime,
  vehicleType,
  chargerType,
  duration,
  estimatedCost,
  onClose,
}) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-8"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15 }}
    >
      <motion.div
        className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(74, 222, 128, 0)',
            '0 0 0 20px rgba(74, 222, 128, 0)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Check className="w-10 h-10 text-green-500" />
      </motion.div>

      <h3 className="text-xl font-bold text-white mb-2">Booking Confirmed!</h3>
      <p className="text-white/70 text-center mb-4">
        Your charging session has been scheduled for
        <br />
        <span className="text-white">
          {selectedDate} at {selectedTime}
        </span>
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
        onClick={onClose}
        variant="outline"
        className="border-white/20 hover:bg-white/10 text-white"
      >
        <X className="mr-2 h-4 w-4" />
        Close
      </Button>
    </motion.div>
  );
};

export default BookingConfirmation;
