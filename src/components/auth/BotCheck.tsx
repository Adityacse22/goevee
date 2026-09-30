import { useEffect, useRef, useState } from 'react';

type Turnstile = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: Turnstile } }
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();
let scriptPromise: Promise<void> | null = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); scriptPromise = null; reject(new Error('Security check could not load.')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function BotCheck({ action, onToken, resetKey }: { action: 'login' | 'register'; onToken: (token: string) => void; resetKey: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!siteKey) return;
    let active = true;
    let widget: string | undefined;
    onToken('');
    setError('');
    loadTurnstile().then(() => {
      if (!active || !container.current || !window.turnstile) return;
      widget = window.turnstile.render(container.current, {
        sitekey: siteKey, action, theme: 'dark', size: 'flexible',
        callback: (token: string) => { setError(''); onToken(token); },
        'expired-callback': () => { onToken(''); setError('Security check expired. Please complete it again.'); },
        'error-callback': () => { onToken(''); setError('Security check unavailable. Reload the page to try again.'); },
      });
    }).catch(() => { if (active) setError('Security check could not load. Check your connection and reload.'); });
    return () => { active = false; if (widget) window.turnstile?.remove(widget); };
  }, [action, onToken, resetKey]);
  return <>
    <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
      <label htmlFor={`website-${action}`}>Leave this field empty</label>
      <input id={`website-${action}`} name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
    {siteKey && <div ref={container} className="min-h-[65px]" />}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </>;
}
