import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Calendar, AlertCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { fetchUserBookings } from '@/services/bookingService';
import type { Booking } from '@/models/booking.model';

const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setIsLoading(true);
        const data = await fetchUserBookings();
        setBookings(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setError('Failed to load your booking history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'active': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'completed': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar hasScrolled />
      
      <main className="flex-grow container mx-auto px-4 pt-28 pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold gradient-text">My Bookings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Track and manage your EV charging sessions.</p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-ev-blue mb-4" />
            <p className="text-slate-500">Fetching your bookings...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-12 text-center backdrop-blur-sm">
            <Calendar className="h-16 w-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Bookings Yet</h2>
            <p className="text-slate-400 mb-8">You haven't made any charging reservations yet.</p>
            <button 
              onClick={() => window.location.href = '/ev-charger-station'}
              className="px-8 py-3 bg-ev-blue text-white rounded-xl font-bold shadow-lg shadow-ev-blue/20 hover:bg-ev-blue/90 transition-all"
            >
              Locate Chargers
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                      {booking.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Ref: {booking.special_requests || booking.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Charging Session</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {new Date(booking.booking_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-sm font-medium text-ev-blue mt-1">
                    {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)} ({booking.duration_hours.toFixed(1)} hrs)
                  </p>
                </div>
                
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-white/5 pt-4 md:pt-0 md:pl-6">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Price</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">₹{booking.total_price}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyBookings;
