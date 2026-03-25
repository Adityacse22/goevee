import { useEffect, useState } from 'react';

export type SDKStatus = 'loading' | 'ready' | 'error';

export function useMapplsLoader() {
  const [status, setStatus] = useState<SDKStatus>('loading');

  useEffect(() => {
    if (window.mappls) {
      setStatus('ready');
      return;
    }

    let attempts = 0;
    const MAX = 100; // 10 seconds max

    const interval = setInterval(() => {
      attempts++;
      if (window.mappls) {
        setStatus('ready');
        clearInterval(interval);
        return;
      }
      if (attempts >= MAX) {
        clearInterval(interval);
        setStatus('error');
        console.error(
          'Mappls SDK failed to load. Check:\n' +
          '1. index.html has both script tags\n' +
          '2. Static key is hardcoded in the URL (not a variable)\n' +
          '3. Key is valid at developer.mappls.com\n' +
          '4. No ad blocker blocking apis.mappls.com'
        );
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return status;
}
