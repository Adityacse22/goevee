/**
 * ENTRY POINT — Bootstrap the React application.
 */

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';
import { SearchProvider } from './controllers/useSearchController.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <SearchProvider>
      <App />
    </SearchProvider>
  </AppErrorBoundary>,
);
