import type { BadgeState } from '@/lib/types';

type PinKind = 'available' | 'limited' | 'full' | 'offline';

export function pinKind(state: BadgeState): PinKind {
  if (state === 'available' || state === 'limited' || state === 'full') return state;
  return 'offline';
}

const FILL: Record<PinKind, string> = {
  available: 'var(--brand-600)',
  limited: 'var(--amber-500)',
  full: 'var(--red-600)',
  offline: 'var(--ink-500)',
};
const GLYPH: Record<PinKind, string> = {
  available: 'var(--on-brand)',
  limited: 'var(--on-amber)',
  full: 'var(--on-red)',
  offline: 'var(--on-muted)',
};

/**
 * 30×38 teardrop with a 2px outline and a bolt. Status is coded by shape as
 * well as colour: limited adds a dot badge, full a bar badge, offline a slash.
 */
export function MapPin({ state }: { state: BadgeState }) {
  const kind = pinKind(state);
  return (
    <svg viewBox="0 0 30 38" aria-hidden="true" focusable="false" style={{ opacity: kind === 'offline' ? 0.7 : 1 }}>
      <path
        d="M15 1.25C7.4 1.25 1.25 7.2 1.25 14.55c0 9.5 12.5 21.4 13.03 21.9a1.05 1.05 0 0 0 1.44 0c.53-.5 13.03-12.4 13.03-21.9C28.75 7.2 22.6 1.25 15 1.25Z"
        style={{ fill: FILL[kind], stroke: 'var(--pin-stroke)' }}
        strokeWidth="2"
      />
      <path d="M16.6 6.9 10.4 15.1h4.2l-1.3 6.6 6.3-8.3h-4.2l1.2-6.5Z" style={{ fill: GLYPH[kind] }} />
      {kind === 'limited' && <circle cx="24.5" cy="5.5" r="4" style={{ fill: 'var(--on-amber)', stroke: 'var(--pin-stroke)' }} strokeWidth="1.6" />}
      {kind === 'full' && <rect x="19.5" y="2.6" width="10" height="5.4" rx="2.7" style={{ fill: 'var(--on-red)', stroke: 'var(--pin-stroke)' }} strokeWidth="1.4" />}
      {kind === 'offline' && <path d="M8.5 21.5 21.5 7.5" style={{ stroke: 'var(--on-muted)' }} strokeWidth="2.2" strokeLinecap="round" />}
    </svg>
  );
}
