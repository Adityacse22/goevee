/**
 * APP — Root component.
 * Thin shell: providers + routes. No business logic.
 * Legacy-only providers (framer-motion config, Google search) live in
 * routes/LegacyLayout so the Explore bundle stays small.
 */

import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/controllers/useAuth';
import Seo from '@/components/Seo';
import CookieConsent from '@/components/privacy/CookieConsent';
import AppRoutes from '@/routes/AppRoutes';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 60 }}
        toastOptions={{
          duration: 3000,
          // Inverted surface from the GoEvee tokens: dark toast in light theme, light toast in dark.
          style: { background: 'var(--ink-950)', color: 'var(--bg)', borderRadius: '12px', fontSize: '14px' },
        }}
      />
      <BrowserRouter>
        <Seo />
        <AppRoutes />
        <CookieConsent />
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
