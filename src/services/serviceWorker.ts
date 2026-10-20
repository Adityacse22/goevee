/**
 * Registers the offline service worker in production builds only.
 * After registration, the page hands over the same-origin assets it already
 * loaded, so the very first visit is enough to open offline later.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(async () => {
        const registration = await navigator.serviceWorker.ready;
        const urls = performance
          .getEntriesByType('resource')
          .map(entry => entry.name)
          .filter(url => {
            try {
              const parsed = new URL(url);
              return parsed.origin === location.origin && /^\/(assets|mock)\//.test(parsed.pathname);
            } catch {
              return false;
            }
          });
        registration.active?.postMessage({ type: 'CACHE_URLS', urls });
      })
      .catch(() => {
        // Offline support is progressive; the site works without it.
      });
  });
}
