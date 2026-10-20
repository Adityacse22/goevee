/**
 * Charger card. Container queries switch between the compact phone layout
 * (specs on their own row) and the reference layout (everything beside a
 * 168px thumbnail) once the card is wide enough. The title is a stretched
 * link; the CTA is a separate link layered above it — no nested controls.
 * Discovered (provider) stations get a Navigate CTA and an explicit
 * "Booking unavailable" note: they are not connected to GoEvee inventory.
 */
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Car, Clock, IndianRupee, Navigation, Plug, Zap } from 'lucide-react';
import { useExplore } from '@/controllers/useExplore';
import { Ccs2Icon } from '@/components/icons/Ccs2Icon';
import { badgeState, displayConnector, freshness, isOpenNow, powerTier, priceInclGst } from '@/lib/filters';
import { formatAddress, formatDistance, formatEta, formatEtaSpoken, formatPower, formatPriceValue, formatTime12h } from '@/lib/format';
import { srPowerTier, t } from '@/lib/messages';
import type { Station } from '@/lib/types';
import { AvailabilityBadge, badgeLabel } from './AvailabilityBadge';
import { LiveIndicator, freshnessLabel } from './LiveIndicator';
import { SpecItem } from './SpecItem';

function hoursSpec(station: Station, now: number) {
  if (station.hours.type === '24x7') return { value: t.card.allDay, sub: t.card.open, spoken: 'open 24 hours', muted: false };
  // Unknown hours (real Google data) have no open/close times to format — degrade honestly.
  if (station.hours.type === 'unknown') return { value: t.card.hoursUnavailable, sub: undefined, spoken: 'hours unavailable', muted: true };
  if (isOpenNow(station.hours, now)) {
    const close = formatTime12h(station.hours.close);
    return { value: t.card.till(close), sub: t.card.open, spoken: `open till ${close}`, muted: false };
  }
  const open = formatTime12h(station.hours.open);
  return { value: t.card.closedShort, sub: t.card.opens(open), spoken: `closed, opens ${open}`, muted: true };
}

interface ChargerCardProps {
  station: Station;
  primary: boolean;
  eager: boolean;
}

export function ChargerCard({ station, primary, eager }: ChargerCardProps) {
  const { now, filters, vehicle, highlightedId, setHighlightedId } = useExplore();
  const state = badgeState(station, now);
  const fresh = freshness(station, now);
  const connector = displayConnector(station, filters, vehicle);
  const tier = connector ? powerTier(connector) : null;
  const location = useLocation();
  const discovery = station.discovery;
  const priceKnown = station.priceKnown !== false;
  const price = formatPriceValue(priceInclGst(station));
  const hours = hoursSpec(station, now);
  const hasDistance = Number.isFinite(station.distanceKm);
  const rawDistance = hasDistance ? formatDistance(station.distanceKm) : '';
  // Discovery distances are straight-line: mark them approximate, visibly and for screen readers.
  const distance = discovery && hasDistance ? t.discovery.approxDistance(rawDistance) : rawDistance;
  const spokenDistance = discovery && hasDistance ? t.discovery.distanceSpoken(rawDistance) : rawDistance;
  const address = formatAddress(station.address);
  const name = station.name || t.discovery.unnamed;
  const closure = discovery?.operationalStatus === 'temporarily_closed'
    ? t.discovery.temporarilyClosed
    : discovery?.operationalStatus === 'future_opening' ? t.discovery.futureOpening : null;
  const inactive = state === 'offline' || state === 'closed' || closure != null;
  const titleId = `station-${station.id}-title`;
  const navigateHref = `/stations/${encodeURIComponent(station.id)}/navigate`;
  const href = discovery ? navigateHref : `/stations/${station.slug}`;
  const returnState = { from: `${location.pathname}${location.search}` };
  const power = connector?.maxPowerKw != null ? connector.maxPowerKw : null;

  const summary = [
    spokenDistance,
    closure ?? badgeLabel(station, state),
    freshnessLabel(fresh).toLowerCase(),
    connector && [t.connectors[connector.type], connector.current].filter(Boolean).join(' '),
    connector && tier && power != null && `${formatPower(power)} ${srPowerTier(tier)}`,
    priceKnown && t.card.priceSpoken(price, station.priceIncludesGst),
    hours.spoken,
    station.etaMin != null && `${formatEtaSpoken(station.etaMin)} away`,
    address,
    discovery && !discovery.bookable && `${t.discovery.bookingUnavailable}: ${t.discovery.bookingUnavailableWhy}`,
  ].filter(Boolean).join(', ');

  return (
    <article
      className="ge-card"
      aria-labelledby={titleId}
      data-offline={state === 'offline'}
      data-highlighted={highlightedId === station.id}
      // Map/card hover sync is for mouse users; taps must not leave a sticky highlight.
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHighlightedId(station.id); }}
      onPointerLeave={event => { if (event.pointerType === 'mouse') setHighlightedId(null); }}
      onFocus={() => setHighlightedId(station.id)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHighlightedId(null); }}
    >
      <div className="ge-card__body">
        <div className="ge-card__media">
          <img
            src={station.imageUrl}
            alt=""
            width={336}
            height={208}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>
        <div className="ge-card__main">
          <h3 className="ge-card__title" id={titleId}>
            <Link to={href} state={returnState} className="ge-card__link">{name}</Link>
          </h3>
          <p className="ge-card__sr ge-sr-only">{summary}</p>
          <span className="ge-card__dist ge-tnum" aria-hidden="true">{distance}</span>
          {station.etaMin != null && (
            <span className="ge-eta" aria-hidden="true">
              <Car strokeWidth={1.75} />
              <span className="ge-eta__stack">
                <span className="ge-eta__value ge-tnum">{formatEta(station.etaMin)}</span>
                <span className="ge-eta__label">{t.card.eta}</span>
              </span>
            </span>
          )}
          <span className="ge-card__addr" aria-hidden="true">{address}</span>
          <span className="ge-card__status" aria-hidden="true">
            {closure ? <span className="ge-badge" data-state="offline">{closure}</span> : <AvailabilityBadge station={station} state={state} />}
            <LiveIndicator freshness={fresh} />
          </span>
        </div>
        <div className="ge-card__specs ge-specs" aria-hidden="true">
          {connector && (
            <SpecItem
              icon={connector.type === 'CCS2' ? <Ccs2Icon /> : <Plug strokeWidth={1.75} />}
              value={t.connectors[connector.type]}
              sub={connector.current ?? undefined}
            />
          )}
          {connector && tier && power != null && (
            <SpecItem
              icon={<Zap className="ge-spec__bolt" strokeWidth={1.75} fill="currentColor" />}
              value={formatPower(power)}
              sub={`(${t.powerTiers[tier]})`}
            />
          )}
          {priceKnown && (
            <SpecItem icon={<IndianRupee strokeWidth={1.75} />} value={`${price}${t.card.perKwh}`} />
          )}
          <SpecItem icon={<Clock strokeWidth={1.75} />} value={hours.value} sub={hours.sub} muted={hours.muted} />
        </div>
      </div>
      {discovery ? (
        <div className="ge-card__actions">
          <Link
            to={navigateHref}
            state={returnState}
            className="ge-cta"
            data-variant={primary && !inactive ? 'primary' : 'secondary'}
            aria-label={t.discovery.navigateTo(name)}
          >
            <Navigation aria-hidden="true" strokeWidth={1.75} />
            {t.discovery.navigate}
          </Link>
          {!discovery.bookable && (
            <p className="ge-card__booking">
              <span className="ge-card__booking-title">{t.discovery.bookingUnavailable}</span>
              <span>{t.discovery.bookingUnavailableWhy}</span>
            </p>
          )}
        </div>
      ) : (
        <Link
          to={inactive ? href : `${href}#slots`}
          className="ge-cta"
          data-variant={primary && !inactive ? 'primary' : 'secondary'}
          aria-label={inactive ? t.card.viewDetailsAt(name) : t.card.viewSlotsAt(name)}
        >
          {inactive ? t.card.viewDetails : t.card.viewSlots}
          <ArrowRight aria-hidden="true" strokeWidth={1.75} />
        </Link>
      )}
    </article>
  );
}
