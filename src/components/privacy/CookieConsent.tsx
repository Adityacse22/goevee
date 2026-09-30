import toast from 'react-hot-toast';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CONSENT_EVENT, CONSENT_KEY, CONSENT_MAX_AGE, SETTINGS_EVENT, readConsent, saveConsent } from '@/services/consent';
import { analyticsConfigured, stopAnalytics, trackPage } from '@/services/analytics';

export default function CookieConsent() {
  const [choice, setChoice] = useState(readConsent);
  const [open, setOpen] = useState(!choice);
  const firstButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const update = () => {
      const next = readConsent();
      setChoice(next);
      if (!next?.analytics) stopAnalytics();
      setOpen(!next);
    };
    const settings = () => {
      previousFocus.current = document.activeElement as HTMLElement;
      setOpen(true);
      requestAnimationFrame(() => firstButton.current?.focus());
    };
    const storage = (event: StorageEvent) => { if (event.key === CONSENT_KEY || event.key === null) update(); };
    window.addEventListener(CONSENT_EVENT, update);
    window.addEventListener(SETTINGS_EVENT, settings);
    window.addEventListener('storage', storage);
    return () => {
      window.removeEventListener(CONSENT_EVENT, update);
      window.removeEventListener(SETTINGS_EVENT, settings);
      window.removeEventListener('storage', storage);
    };
  }, []);

  useEffect(() => {
    if (!choice) return;
    let timer: number;
    const checkExpiry = () => {
      const remaining = choice.updatedAt + CONSENT_MAX_AGE - Date.now();
      if (remaining <= 0) {
        setChoice(null);
        setOpen(true);
        stopAnalytics();
      } else timer = window.setTimeout(checkExpiry, Math.min(remaining, 2147483647));
    };
    checkExpiry();
    return () => window.clearTimeout(timer);
  }, [choice]);

  useEffect(() => { if (choice?.analytics) trackPage(pathname); }, [choice, pathname]);

  const choose = (analytics: boolean) => {
    const saved = saveConsent(analytics);
    if (!saved) toast('Your choice applies to this tab. Browser storage could not save it. Clear site data in browser settings to remove any older preference.', { duration: 10000 });
    setOpen(false);
    previousFocus.current?.focus();
  };

  if (!open) return null;
  return <section aria-labelledby="cookie-title" aria-describedby="cookie-description" className="cookie-banner fixed inset-x-3 bottom-3 z-[2000] mx-auto max-h-[65dvh] max-w-4xl overflow-y-auto rounded-2xl border border-white/25 bg-zinc-950 p-5 text-white shadow-2xl sm:inset-x-6 sm:bottom-6 sm:p-6">
    <h2 id="cookie-title" className="text-lg font-semibold">Your privacy choices</h2>
    <p id="cookie-description" className="mt-2 text-sm leading-6 text-slate-300">We use essential storage to keep the site working. With your permission, optional analytics helps us understand public page visits. {analyticsConfigured ? '' : 'Analytics is currently not configured. '}You can change your choice at any time. <Link className="text-cyan-300 underline" to="/cookies">Cookies & storage</Link> · <Link className="text-cyan-300 underline" to="/privacy">Privacy policy</Link></p>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
      <button ref={firstButton} type="button" className="action-secondary" onClick={() => choose(false)}>Reject analytics</button>
      <button type="button" className="action-secondary" onClick={() => choose(true)}>Accept analytics</button>
      {choice && <button type="button" className="action-secondary" onClick={() => { setOpen(false); previousFocus.current?.focus(); }}>Close settings</button>}
    </div>
  </section>;
}
