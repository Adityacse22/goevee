import { t } from '@/lib/messages';
import type { Freshness } from '@/lib/types';

export function freshnessLabel(freshness: Freshness): string {
  if (freshness.kind === 'live') return t.card.live;
  if (freshness.kind === 'recent') return t.card.updated(freshness.minutes);
  return t.card.statusUnavailable;
}

/** The trust contract: "Live" only under 2 minutes; never on stale data. */
export function LiveIndicator({ freshness }: { freshness: Freshness }) {
  return (
    <span className="ge-live ge-tnum" data-kind={freshness.kind}>
      {freshness.kind === 'live' && <span className="ge-live-dot" aria-hidden="true" />}
      {freshnessLabel(freshness)}
    </span>
  );
}
