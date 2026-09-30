import { pageMetadata, SITE_URL } from '@/config/site';
import { readConsent, clearAnalyticsCookies, canReloadWithoutAnalytics } from './consent';

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? '';
export const analyticsConfigured = /^G-[A-Z0-9]+$/.test(measurementId);
let started = false;
let lastPage = '';
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; [key: `ga-disable-${string}`]: boolean };
const analyticsWindow = () => window as unknown as AnalyticsWindow;

export function stopAnalytics() {
  if (!analyticsConfigured) return;
  analyticsWindow()[`ga-disable-${measurementId}`] = true;
  clearAnalyticsCookies();
  lastPage = '';
  // Unload the library only when a fresh document cannot reuse an old stored grant.
  // With blocked storage, keep this document alive and GA disabled instead.
  if (started && canReloadWithoutAnalytics()) location.reload();
}

export function trackPage(pathname: string) {
  if (!analyticsConfigured || !readConsent()?.analytics) return;
  const page = pageMetadata[pathname];
  // Never send arbitrary paths, query strings, account pages or station IDs.
  if (!page?.index) return;
  const w = analyticsWindow();
  // An explicit new opt-in can resume an instance kept alive after storage failed.
  w[`ga-disable-${measurementId}`] = false;
  if (!started) {
    w.dataLayer = w.dataLayer ?? [];
    // Google’s gtag queue expects the arguments object.
    // eslint-disable-next-line prefer-rest-params
    w.gtag = function () { w.dataLayer!.push(arguments); };
    w.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    w.gtag('js', new Date());
    w.gtag('config', measurementId, {
      send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_expires: 15552000, cookie_update: false, cookie_flags: 'SameSite=Lax;Secure',
      page_location: SITE_URL + pathname, page_referrer: '',
    });
    const script = document.createElement('script');
    script.id = 'evee-analytics';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    started = true;
  }
  if (lastPage === pathname) return;
  lastPage = pathname;
  w.gtag?.('event', 'page_view', { page_title: page.title, page_location: SITE_URL + pathname, page_referrer: '' });
}

export function trackFindChargers() {
  if (!analyticsConfigured || !readConsent()?.analytics || !started) return;
  analyticsWindow().gtag?.('event', 'find_chargers', { page_location: SITE_URL + '/', page_referrer: '' });
}
