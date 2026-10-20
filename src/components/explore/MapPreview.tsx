/**
 * Map preview — a lightweight, illustrative inline SVG (no map SDK on the home
 * page). It is NOT a map of the area: Google Places results may only be drawn
 * on a Google map, so provider stations are never plotted here. It shows the
 * search centre and links to the real map view; stations from GoEvee's own
 * inventory (no provider provenance) may still be pinned.
 */
import { memo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map as MapIcon } from 'lucide-react';
import { useExplore } from '@/controllers/useExplore';
import { useSeenOnce } from '@/hooks/useExploreHooks';
import { badgeState } from '@/lib/filters';
import { projectToPreview } from '@/lib/map-projection';
import { t } from '@/lib/messages';
import { previewHref } from '@/lib/url-state';
import { DEFAULT_RADIUS } from '@/config/constants';
import type { Origin, Station } from '@/lib/types';
import { MapPin, pinKind } from './MapPin';

const MapBase = memo(function MapBase() {
  return (
    <svg className="ge-map__base" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <rect className="block" x="40" y="40" width="120" height="70" rx="10" />
      <rect className="block" x="350" y="250" width="150" height="80" rx="10" />
      <rect className="block" x="420" y="40" width="110" height="60" rx="10" />
      <rect className="block" x="70" y="250" width="110" height="90" rx="10" />
      <path className="park" d="M210 70c30-24 92-18 108 10 14 26-10 52-50 54-46 2-86-38-58-64Z" />
      <path className="park" d="M470 150c26-12 70-2 76 24 6 26-26 40-58 34-34-6-46-44-18-58Z" />
      <path className="park" d="M150 170c18-10 50-6 56 14s-16 32-40 28c-26-4-34-32-16-42Z" />
      <path className="water" d="M-20 330c70-30 120-10 170 10s110 40 180 20 120-50 300-20v90H-20Z" />
      <g fill="none" strokeLinecap="round">
        <path className="road-casing" strokeWidth="16" d="M-20 205C120 190 230 214 320 206s210-34 300-30" />
        <path className="road" strokeWidth="11" d="M-20 205C120 190 230 214 320 206s210-34 300-30" />
        <path className="road-casing" strokeWidth="14" d="M250-20c8 90 2 170 10 250s36 140 40 190" />
        <path className="road" strokeWidth="9" d="M250-20c8 90 2 170 10 250s36 140 40 190" />
        <path className="road-casing" strokeWidth="10" d="M-20 110c110 6 190-6 280 4s170 18 360-6" />
        <path className="road" strokeWidth="6" d="M-20 110c110 6 190-6 280 4s170 18 360-6" />
        <path className="road-casing" strokeWidth="10" d="M120-20c-4 120 14 240 0 440" />
        <path className="road" strokeWidth="6" d="M120-20c-4 120 14 240 0 440" />
        <path className="road-casing" strokeWidth="10" d="M430-20c-6 140 18 230 4 440" />
        <path className="road" strokeWidth="6" d="M430-20c-6 140 18 230 4 440" />
        <path className="road-casing" strokeWidth="9" d="M300 300c80 0 190-8 320 4" />
        <path className="road" strokeWidth="5" d="M300 300c80 0 190-8 320 4" />
        <path className="rail" strokeWidth="3" strokeDasharray="9 7" d="M330-20 560 420" />
      </g>
    </svg>
  );
});

function mapLabels(origin: Origin | null) {
  if (!origin?.label) return [];
  const [name, area] = origin.label.split(',').map(part => part.trim());
  return area ? [{ text: area, x: 76, y: 16 }, { text: name, x: 19, y: 86 }] : [{ text: name, x: 50, y: 10 }];
}

interface PinsProps {
  stations: Station[];
  origin: Origin;
  now: number;
  interactive: boolean;
  highlightedId: string | null;
  onHighlight: (id: string | null) => void;
  onOpen: (station: Station) => void;
}

function Pins({ stations, origin, now, interactive, highlightedId, onHighlight, onOpen }: PinsProps) {
  // The user marker is the origin projected against itself → the center {50,50}.
  const user = projectToPreview(origin.coords.lat, origin.coords.lng, origin.coords.lat, origin.coords.lng, DEFAULT_RADIUS);
  return (
    <div className="ge-map__pins" aria-hidden="true">
      <span className="ge-user-dot" style={{ left: `${user.x}%`, top: `${user.y}%` }} />
      {stations.map(station => {
        const { x, y } = projectToPreview(origin.coords.lat, origin.coords.lng, station.coords.lat, station.coords.lng, DEFAULT_RADIUS);
        return (
          <div
            key={station.id}
            className={`ge-pin ${interactive ? 'ge-pin--interactive' : ''}`}
            data-kind={pinKind(badgeState(station, now))}
            data-active={highlightedId === station.id}
            style={{ left: `${x}%`, top: `${y}%` }}
            onMouseEnter={interactive ? () => onHighlight(station.id) : undefined}
            onMouseLeave={interactive ? () => onHighlight(null) : undefined}
            onClick={interactive ? () => onOpen(station) : undefined}
          >
            <MapPin state={badgeState(station, now)} />
          </div>
        );
      })}
    </div>
  );
}

export function MapPreview({ variant }: { variant: 'mobile' | 'desktop' }) {
  const { results, status, origin, filters, sort, highlightedId, setHighlightedId, now, onFirstSeen, centerLabel } = useExplore();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement & HTMLAnchorElement>(null);
  const seen = useSeenOnce(ref);
  useEffect(() => { if (seen) onFirstSeen(); }, [seen, onFirstSeen]);
  const ready = seen && status === 'ready' && origin != null;
  const href = origin ? previewHref(origin, filters, sort) : '/ev-charger-station';
  // Provider (Google) stations are shown on a Google map only — never on this illustration.
  const inventory = results.filter(station => !station.discovery);
  const pins = variant === 'mobile' ? inventory.slice(0, 4) : inventory;
  const label = origin ? t.map.areaLabel(centerLabel ?? origin.label) : t.map.noArea;
  const labels = mapLabels(origin);

  const canvas = ready ? (
    <>
      <MapBase />
      {labels.map(item => (
        <span
          key={item.text}
          aria-hidden="true"
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-medium text-ink-600 [text-shadow:0_0_3px_var(--map-land),0_0_3px_var(--map-land)]"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
        >
          {item.text}
        </span>
      ))}
      <Pins
        stations={pins}
        origin={origin}
        now={now}
        interactive={variant === 'desktop'}
        highlightedId={highlightedId}
        onHighlight={setHighlightedId}
        onOpen={station => navigate(`/stations/${station.slug}`)}
      />
    </>
  ) : (
    <span className={status === 'loading' || status === 'locating' ? 'ge-skel absolute inset-0' : 'absolute inset-0'} aria-hidden="true" />
  );

  if (variant === 'mobile') {
    return (
      <Link ref={ref} to={href} className="ge-map ge-map--mobile" aria-label={ready ? label : t.map.open}>
        {canvas}
        <span className="ge-map__btn" aria-hidden="true">
          <MapIcon strokeWidth={1.75} />
          {t.map.open}
        </span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="ge-map" role="group" aria-label={ready ? label : t.map.open}>
      {canvas}
      <Link to={href} className="ge-map__btn ge-press">
        <MapIcon aria-hidden="true" strokeWidth={1.75} />
        {t.map.open}
      </Link>
    </div>
  );
}
