import { useEffect, useState } from 'react';

export type SDKStatus = 'loading' | 'ready' | 'error';

const SCRIPT_ID = 'google-maps-js';

function isGoogleReady(): boolean {
  return Boolean(window.google?.maps?.Map && window.google.maps.Geocoder);
}

export function useGoogleMapsLoader(): SDKStatus {
  const [status, setStatus] = useState<SDKStatus>(() => (
    typeof window !== 'undefined' && isGoogleReady() ? 'ready' : 'loading'
  ));

  useEffect(() => {
    if (isGoogleReady()) {
      setStatus('ready');
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
    if (!apiKey) {
      setStatus('error');
      return;
    }

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => setStatus('ready'), { once: true });
      existingScript.addEventListener('error', () => setStatus('error'), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.onload = () => setStatus(isGoogleReady() ? 'ready' : 'error');
    script.onerror = () => setStatus('error');
    document.head.appendChild(script);
  }, []);

  return status;
}
