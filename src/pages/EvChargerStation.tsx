import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon, Calendar, Activity, Wallet, Bookmark, Bell, ChevronRight, User, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MapComponent from '@/components/Map';
import StationPanel from '@/components/stations/StationPanel';
import SearchBar from '@/components/SearchBar';
import BookingModal from '@/components/booking/BookingModal';
import type { BookingDetails } from '@/components/booking/BookingModal';
import { useSearch } from '@/controllers/useSearchController';
import { useAuth } from '@/controllers/useAuth';
import { useCreateBooking } from '@/controllers/useBookings';
import type { EVStation } from '@/models/station.model';

const EvChargerStation = () => {
  const [stations, setStations] = useState<EVStation[]>([]);
  const [highlightedStationId, setHighlightedStationId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { requestCurrentLocation, locationStatus } = useSearch();
  const { user } = useAuth();
  const createBooking = useCreateBooking();

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<EVStation | null>(null);

  // Sync theme on mount
  useEffect(() => {
    let savedTheme: string | null = null;
    try { savedTheme = localStorage.getItem('theme'); } catch { /* Use the default theme when storage is unavailable. */ }
    const isDark = savedTheme !== 'light'; // Default to dark
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle('light-mode', !isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try { localStorage.setItem('theme', newMode ? 'dark' : 'light'); } catch { /* Keep the preference for this page. */ }
    document.documentElement.classList.toggle('light-mode', !newMode);
    toast.success(`${newMode ? 'Dark' : 'Light'} mode activated`);
  };

  // Filter states
  const [availableOnly, setAvailableOnly] = useState(false);
  const [fastOnly, setFastOnly] = useState(false);
  const [ccs2Only, setCcs2Only] = useState(false);

  const handleStationClick = React.useCallback((station: EVStation) => {
    setHighlightedStationId(station.id);
    setIsPanelOpen(true);
  }, []);

  const handleStationsUpdate = React.useCallback((newStations: EVStation[]) => {
    setStations(newStations);
    if (newStations.length > 0) {
      setIsPanelOpen(true);
    }
  }, []);

  const handleHighlightedStationChange = React.useCallback((id: string | null) => {
    setHighlightedStationId(id);
  }, []);

  const handleBookStation = (station: EVStation) => {
    if (!user) {
      toast.error('Please log in to book a station');
      return;
    }
    setSelectedStation(station);
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = (booking: BookingDetails) => {
    // booking.timeSlot is "HH:mm:ss"
    // booking.duration is in hours (0.5, 1, 2, etc.)
    const [h, m, s] = booking.timeSlot.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(h, m, s);

    const endDate = new Date(startDate.getTime() + booking.duration * 3600000);
    const end_time = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`;

    createBooking.mutate({
      connector_id: booking.connectorId,
      booking_date: booking.date,
      start_time: booking.timeSlot,
      end_time: end_time,
      total_price: booking.estimatedCost,
      status: 'confirmed',
      user_id: user?.id || '',
      station_id: booking.stationId,
      duration_hours: booking.duration,
    }, {
      onSuccess: () => {
        setIsBookingOpen(false);
        setSelectedStation(null);
      }
    });
  };

  // Filtered and Sorted Stations
  const filteredStations = useMemo(() => {
    let result = [...stations];

    if (availableOnly) {
      result = result.filter(s => s.available);
    }

    if (fastOnly) {
      // Fast = any connector >= 50kW
      result = result.filter(s => s.connectors?.some(c => c.power_output >= 50));
    }

    if (ccs2Only) {
      result = result.filter(s => s.connectors?.some(c => c.connector_type.toLowerCase().includes('ccs2')));
    }

    // Always sort by distance ascending for the dashboard view
    return result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [stations, availableOnly, fastOnly, ccs2Only]);

  const navItems = [
    { icon: <MapIcon className="w-5 h-5" />, label: 'Map', path: '/ev-charger-station', active: true },
    { icon: <Calendar className="w-5 h-5" />, label: 'Bookings', path: '/bookings' },
    { icon: <Activity className="w-5 h-5" />, label: 'About Evee', path: '/about' },
    { icon: <Wallet className="w-5 h-5" />, label: 'Help & contact', path: '/help' },
    { icon: <Bookmark className="w-5 h-5" />, label: 'Saved Places', path: '/favorites' },
    { icon: <Bell className="w-5 h-5" />, label: 'Privacy & cookies', path: '/cookies' },
  ];

  return (
    <div className="flex h-dvh w-full bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-200 transition-colors duration-300">
      {/* Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-white/5 p-4 z-20 shadow-xl">
        <div className="flex items-center justify-between mb-8 px-2">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold gradient-text">Evee</span>
          </Link>
          <button
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-ev-blue" />}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? 'bg-ev-green/10 text-ev-green font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Profile */}
        <Link
          to={user ? "/profile" : "/login"}
          className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-ev-blue/30 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ev-blue/20 flex items-center justify-center group-hover:bg-ev-blue/30 transition-colors">
              <User className="w-5 h-5 text-ev-blue" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.fullName || "Guest"}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">{user ? "Pro Member" : "Welcome"}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 ml-auto group-hover:text-ev-blue transition-colors" />
          </div>
        </Link>
      </aside>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 relative flex flex-col h-full overflow-hidden bg-slate-950">
        <h1 className="sr-only">Find EV charging stations</h1>
        <nav aria-label="Mobile navigation" className="absolute inset-x-4 top-3 z-30 flex items-center justify-between rounded-xl bg-slate-950/95 p-2 text-white md:hidden">
          <Link to="/" className="gradient-text text-xl font-bold">Evee</Link>
          <Link className="text-sm underline" to="/help">Help</Link>
          <Link className="text-sm underline" to="/cookies">Privacy</Link>
          <Link className="text-sm underline" to={user ? '/profile' : '/login'}>{user ? 'Profile' : 'Sign in'}</Link>
        </nav>
        {/* Top Search Bar */}
        <div className="absolute top-16 md:top-4 left-4 right-4 z-20 flex flex-col gap-3 pointer-events-none">
          <div className="max-w-2xl pointer-events-auto bg-slate-950/80 backdrop-blur-xl rounded-2xl p-1 shadow-2xl border border-white/10">
            <SearchBar />
          </div>
          {/* Filters */}
          <div className="flex gap-2 pointer-events-auto overflow-x-auto pb-2 scrollbar-hide">
            <button
              aria-pressed={availableOnly}
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap shadow-sm ${
                availableOnly
                  ? 'bg-ev-green text-slate-950 border-ev-green'
                  : 'bg-slate-900 text-white border-white/10 hover:bg-slate-800'
              }`}
            >
              ⚡ Available now
            </button>
            <button
              aria-pressed={fastOnly}
              onClick={() => setFastOnly(!fastOnly)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap shadow-sm ${
                fastOnly
                  ? 'bg-ev-blue text-white border-ev-blue'
                  : 'bg-slate-900 text-white border-white/10 hover:bg-slate-800'
              }`}
            >
              🚀 Fast Charger
            </button>
            <button
              aria-pressed={ccs2Only}
              onClick={() => setCcs2Only(!ccs2Only)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap shadow-sm ${
                ccs2Only
                  ? 'bg-ev-blue text-white border-ev-blue'
                  : 'bg-slate-900 text-white border-white/10 hover:bg-slate-800'
              }`}
            >
              ⚇ CCS2
            </button>
          </div>
        </div>

        {/* Prominent Live Location CTA (if not loading and not active) */}
        {locationStatus === 'idle' && (
          <div className="absolute top-44 md:top-32 left-1/2 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 z-20 pointer-events-auto">
            <button
              onClick={requestCurrentLocation}
              className="bg-ev-blue text-white px-5 sm:px-8 py-3 rounded-full font-bold shadow-xl shadow-ev-blue/30 hover:bg-ev-blue/90 transition-all flex items-center gap-2 transform hover:scale-105"
            >
              <MapIcon className="w-5 h-5" />
              Use my live location
            </button>
          </div>
        )}

        {/* Map */}
        <div className="absolute inset-0 z-0">
          <MapComponent
            onStationsUpdate={handleStationsUpdate}
            onHighlightedStationChange={handleHighlightedStationChange}
            showControls={false}
          />
        </div>
      </main>

      {/* Right/Side Panel using existing StationPanel logic (conditionally opened) */}
      <StationPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        stations={filteredStations}
        onBookStation={handleBookStation}
        highlightedStationId={highlightedStationId}
        onStationClick={handleStationClick}
      />

      <BookingModal
        isOpen={isBookingOpen}
        station={selectedStation}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedStation(null);
        }}
        onConfirm={handleConfirmBooking}
      />
    </div>
  );
};

export default EvChargerStation;
