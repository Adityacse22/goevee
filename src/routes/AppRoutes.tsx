/**
 * ROUTES — Application route configuration.
 * Extracted from App.tsx to separate routing concerns.
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
const Index = lazy(() => import('@/pages/Index'));
const Booking = lazy(() => import('@/pages/Booking'));
const Login = lazy(() => import('@/pages/Login'));
const SignUp = lazy(() => import('@/pages/SignUp'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const NearbyStations = lazy(() => import('@/pages/NearbyStations'));
const StationDetails = lazy(() => import('@/pages/StationDetails'));
const MyBookings = lazy(() => import('@/pages/MyBookings'));
const Favorites = lazy(() => import('@/pages/Favorites'));
const Profile = lazy(() => import('@/pages/Profile'));
const OperatorDashboard = lazy(() => import('@/pages/OperatorDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { BookingHistory, VehicleProfile, Settings } from '@/pages/Placeholders';
const EvChargerStation = lazy(() => import('@/pages/EvChargerStation'));

const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Cookies = lazy(() => import('@/pages/Cookies'));
const Help = lazy(() => import('@/pages/Help'));
const About = lazy(() => import('@/pages/About'));

const AppRoutes = () => (
  <Suspense fallback={<main className="grid min-h-screen place-items-center" role="status">Loading Evee…</main>}>
  <Routes>
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/cookies" element={<Cookies />} />
    <Route path="/contact" element={<Navigate to="/help" replace />} />
    <Route path="/reset-password" element={<Navigate to="/help" replace />} />
    <Route path="/" element={<Index />} />
    <Route path="/ev-charger-station" element={<EvChargerStation />} />
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
  </Suspense>
);

export default AppRoutes;
