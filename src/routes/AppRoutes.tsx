/**
 * ROUTES — Application route configuration.
 * Extracted from App.tsx to separate routing concerns.
 */

import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Booking from '@/pages/Booking';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import NotFound from '@/pages/NotFound';
import NearbyStations from '@/pages/NearbyStations';
import StationDetails from '@/pages/StationDetails';
import MyBookings from '@/pages/MyBookings';
import Favorites from '@/pages/Favorites';
import Profile from '@/pages/Profile';
import OperatorDashboard from '@/pages/OperatorDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { BookingHistory, VehicleProfile, Settings, Help, About } from '@/pages/Placeholders';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/search" element={<NearbyStations />} />
    <Route path="/stations" element={<NearbyStations />} />
    <Route path="/stations/:stationId" element={<StationDetails />} />
    <Route path="/booking" element={<Booking />} />
    <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
    <Route path="/bookings/history" element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} />
    <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/vehicle" element={<ProtectedRoute><VehicleProfile /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="/help" element={<Help />} />
    <Route path="/about" element={<About />} />
    <Route path="/operator" element={<ProtectedRoute roles={['OPERATOR', 'ADMIN']}><OperatorDashboard /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
