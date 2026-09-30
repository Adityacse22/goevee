/**
 * APP — Root component.
 * Thin shell: providers + routes. No business logic.
 */

import { Toaster } from 'react-hot-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/controllers/useAuth';
import { MotionConfig } from 'framer-motion';
import Seo from '@/components/Seo';
import CookieConsent from '@/components/privacy/CookieConsent';
import AppRoutes from '@/routes/AppRoutes';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#333', color: '#fff' },
          }}
        />
        <BrowserRouter>
          <MotionConfig reducedMotion="user">
          <a className="skip-link" href="#main-content">Skip to content</a>
          <Seo />
          <AppRoutes />
          <CookieConsent />
          </MotionConfig>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
