import { useEffect, useRef, useState } from 'react';
import { availableCount, operationalCount } from '@/lib/filters';
import { t } from '@/lib/messages';
import type { BadgeState, Station } from '@/lib/types';

export function badgeLabel(station: Station, state: BadgeState): string {
  switch (state) {
    case 'available':
    case 'limited':
      return t.card.available(availableCount(station), station.connectors.length);
    case 'full':
      return t.card.full(operationalCount(station));
    case 'offline':
      return t.card.offline;
    case 'closed':
      return t.card.closed;
    default:
      return t.card.unknown;
  }
}

/** Pill with text + colour. A live change cross-fades the text and flashes mint, with no layout shift. */
export function AvailabilityBadge({ station, state }: { station: Station; state: BadgeState }) {
  const label = badgeLabel(station, state);
  const previous = useRef(label);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (previous.current === label) return undefined;
    previous.current = label;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 600);
    return () => window.clearTimeout(timer);
  }, [label]);

  return (
    <span className="ge-badge" data-state={state} data-flash={flash}>
      <span key={label} className="ge-badge__text">{label}</span>
    </span>
  );
}
