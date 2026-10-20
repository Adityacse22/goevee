/**
 * ENTRY POINT — Bootstrap the React application.
 */

import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/noto-sans-devanagari';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';
import { registerServiceWorker } from './services/serviceWorker';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);

registerServiceWorker();
