/**
 * ROUTES — Application route configuration.
 * Redesigned pages render inside ShellLayout (bundled with the entry for a fast
 * first paint); legacy pages stay lazy behind LegacyLayout.
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ShellLayout from '@/components/shell/ShellLayout';
import Explore from '@/pages/Explore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const LegacyLayout = lazy(() => import('./LegacyLayout'));
const BookingHistory = lazy(() => import('@/pages/Placeholders').then(module => ({ default: module.BookingHistory })));
const VehicleProfile = lazy(() => import('@/pages/Placeholders').then(module => ({ default: module.VehicleProfile })));
const Settings = lazy(() => import('@/pages/Placeholders').then(module => ({ default: module.Settings })));
const Chargers = lazy(() => import('@/pages/Chargers'));
const MapPage = lazy(() => import('@/pages/MapPage'));
const Wallet = lazy(() => import('@/pages/Wallet'));
const StationRoute = lazy(() => import('@/pages/StationRoute'));
const StationNavigate = lazy(() => import('@/pages/StationNavigate'));
// GoEvee app screens (mockup build)
const AppScreenLayout = lazy(() => import('@/features/goevee-app/AppScreenLayout'));
const NearbyScreen = lazy(() => import('@/features/goevee-app/NearbyScreen'));
const MapScreen = lazy(() => import('@/features/goevee-app/MapScreen'));
const SearchLocationScreen = lazy(() => import('@/features/goevee-app/SearchLocationScreen'));
const LocationPermissionScreen = lazy(() => import('@/features/goevee-app/LocationPermissionScreen'));
const UpdatesScreen = lazy(() => import('@/features/goevee-app/UpdatesScreen'));
const ComingSoon = lazy(() => import('@/features/goevee-app/ComingSoon'));
const StationDetailsScreen = lazy(() => import('@/features/goevee-app/StationDetailsScreen'));
const BookSlotScreen = lazy(() => import('@/features/goevee-app/BookSlotScreen'));
const Booking = lazy(() => import('@/pages/Booking'));
const Login = lazy(() => import('@/pages/Login'));
const SignUp = lazy(() => import('@/pages/SignUp'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const NearbyStations = lazy(() => import('@/pages/NearbyStations'));
const MyBookings = lazy(() => import('@/pages/MyBookings'));
const Favorites = lazy(() => import('@/pages/Favorites'));
const Profile = lazy(() => import('@/pages/Profile'));
const OperatorDashboard = lazy(() => import('@/pages/OperatorDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const EvChargerStation = lazy(() => import('@/pages/EvChargerStation'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Cookies = lazy(() => import('@/pages/Cookies'));
const Help = lazy(() => import('@/pages/Help'));
const About = lazy(() => import('@/pages/About'));

const AppRoutes = () => (
  <Suspense fallback={<main className="grid min-h-[100dvh] place-items-center" role="status">Loading GoEvee…</main>}>
    <Routes>
      <Route element={<ShellLayout />}>
        <Route path="/" element={<Explore />} />
        <Route path="/chargers" element={<Suspense fallback={null}><Chargers /></Suspense>} />
        <Route path="/map" element={<Suspense fallback={null}><MapPage /></Suspense>} />
        <Route path="/wallet" element={<Suspense fallback={null}><Wallet /></Suspense>} />
        <Route path="/stations/:stationId/navigate" element={<Suspense fallback={null}><StationNavigate /></Suspense>} />
      </Route>
      <Route path="/stations/:stationId" element={<StationRoute />} />
      <Route path="/app" element={<Suspense fallback={null}><AppScreenLayout /></Suspense>}>
        <Route index element={<Suspense fallback={null}><NearbyScreen /></Suspense>} />
        <Route path="map" element={<Suspense fallback={null}><MapScreen /></Suspense>} />
        <Route path="search" element={<Suspense fallback={null}><SearchLocationScreen /></Suspense>} />
        <Route path="enable-location" element={<Suspense fallback={null}><LocationPermissionScreen /></Suspense>} />
        <Route path="updates" element={<Suspense fallback={null}><UpdatesScreen /></Suspense>} />
        <Route path="bookings" element={<Suspense fallback={null}><ComingSoon title="Bookings" /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={null}><ComingSoon title="Profile" /></Suspense>} />
        <Route path="vehicles" element={<Suspense fallback={null}><ComingSoon title="My EV Fleet" /></Suspense>} />
      </Route>
      <Route path="/app/stations/:stationId" element={<Suspense fallback={null}><StationDetailsScreen /></Suspense>} />
      <Route path="/app/book/:stationId" element={<Suspense fallback={null}><BookSlotScreen /></Suspense>} />
      <Route element={<LegacyLayout />}>
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/contact" element={<Navigate to="/help" replace />} />
        <Route path="/reset-password" element={<Navigate to="/help" replace />} />
        <Route path="/ev-charger-station" element={<EvChargerStation />} />
        <Route path="/search" element={<NearbyStations />} />
        <Route path="/stations" element={<NearbyStations />} />
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
      </Route>
    </Routes>
  </Suspense>
);

export default AppRoutes;
