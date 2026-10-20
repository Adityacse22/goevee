/**
 * /stations/:stationId/navigate — deep-linkable station page with a Google map
 * marker and a hand-off to Google Maps for the actual route. Works after a
 * refresh (details are fetched by provider ID). GoEvee draws no route line:
 * routes, distance and travel time come from Google Maps itself.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronLeft, ExternalLink, Navigation } from 'lucide-react';
import { useExplore } from '@/controllers/useExplore';
import { useGoogleMapsLoader } from '@/controllers/useGoogleMapsLoader';
import { TYPE_FOR } from '@/lib/discovery/adapter';
import { DiscoveryRequestError, getStationDetails } from '@/lib/discovery/client';
import { formatClockIST, formatDistance, formatPower } from '@/lib/format';
import { t } from '@/lib/messages';
import { geodesicDistanceMeters, googleMapsDirectionsUrl, PLACE_ID_PATTERN, type DiscoveryStationDetails } from '../../shared/discovery';

/** A device fix older than this is not used as an explicit route origin. */
const ORIGIN_MAX_AGE_MS = 5 * 60_000;

declare global {
  interface Window { gm_authFailure?: () => void }
}

function safeReturnPath(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function StationMap({ station }: { station: DiscoveryStationDetails }) {
  const sdk = useGoogleMapsLoader(true);
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const name = station.name || t.discovery.unnamed;

  useEffect(() => {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => setFailed(true);
    return () => { window.gm_authFailure = previous; };
  }, []);

  useEffect(() => {
    if (sdk !== 'ready' || failed || !ref.current) return undefined;
    try {
      const maps = window.google.maps;
      const position = { lat: station.location.lat, lng: station.location.lng };
      const map = new maps.Map(ref.current, { center: position, zoom: 15, clickableIcons: false, gestureHandling: 'cooperative', streetViewControl: false, mapTypeControl: false, fullscreenControl: false });
      const marker = new maps.Marker({ position, map, title: name });
      return () => marker.setMap(null);
    } catch {
      setFailed(true);
      return undefined;
    }
  }, [failed, name, sdk, station.location.lat, station.location.lng]);

  if (sdk === 'error' || failed) {
    return (
      <div className="ge-nav-map" data-state="map-failed">
        <p className="ge-nav-map__fallback" role="status">
          {t.navigatePage.mapFailed}
          <br />
          {t.navigatePage.coordinates(station.location.lat.toFixed(5), station.location.lng.toFixed(5))}
        </p>
      </div>
    );
  }
  return <div ref={ref} className="ge-nav-map" role="img" aria-label={t.navigatePage.mapLabel(name)} data-state={sdk} />;
}

function statusWarning(station: DiscoveryStationDetails): string | null {
  if (station.operationalStatus === 'permanently_closed') return t.navigatePage.permanentlyClosed;
  if (station.operationalStatus === 'temporarily_closed') return t.navigatePage.temporarilyClosed;
  if (station.operationalStatus === 'future_opening') return t.navigatePage.futureOpening;
  return null;
}

export default function StationNavigate() {
  const { stationId = '' } = useParams();
  const location = useLocation();
  const { deviceLocation, now } = useExplore();
  const backTo = safeReturnPath((location.state as { from?: unknown } | null)?.from);
  const validId = PLACE_ID_PATTERN.test(stationId);

  const query = useQuery({
    queryKey: ['discovery', 'station', stationId],
    queryFn: ({ signal }) => getStationDetails(stationId, signal),
    enabled: validId,
    staleTime: 5 * 60_000,
    retry: (count, error) => count < 1 && !(error instanceof DiscoveryRequestError && (error.code === 'NOT_FOUND' || error.code === 'INVALID_REQUEST')),
  });
  const station = query.data;
  const name = station ? station.name || t.discovery.unnamed : '';

  useEffect(() => {
    if (station) document.title = `${name} · Navigate · GoEvee`;
  }, [name, station]);

  const notFound = !validId || (query.error instanceof DiscoveryRequestError && query.error.code === 'NOT_FOUND');
  const freshFix = deviceLocation && now - deviceLocation.timestamp <= ORIGIN_MAX_AGE_MS ? deviceLocation : null;
  const directions = station
    ? googleMapsDirectionsUrl({ destination: station.location, destinationPlaceId: station.id, origin: freshFix?.coords ?? null })
    : null;
  const distance = station && deviceLocation ? formatDistance(geodesicDistanceMeters(deviceLocation.coords, station.location) / 1000) : null;
  const warning = station ? statusWarning(station) : null;

  return (
    <main id="main-content" tabIndex={-1} className="ge-main outline-none">
      <div className="ge-container max-w-2xl">
        <Link to={backTo} className="ge-back mt-2"><ChevronLeft aria-hidden="true" strokeWidth={1.75} />{t.navigatePage.back}</Link>

        {validId && query.isPending && <p className="ge-page-lead" role="status">{t.navigatePage.loading}</p>}
        {notFound && <h1 className="ge-page-title mt-4">{t.navigatePage.notFound}</h1>}
        {!notFound && query.isError && (
          <div className="ge-empty" role="alert" data-state="error">
            <h1 className="ge-h2">{t.navigatePage.loadFailed}</h1>
            <p>{t.discovery.errors[query.error instanceof DiscoveryRequestError ? query.error.code : 'NETWORK']}</p>
            <div className="ge-empty__actions">
              <button type="button" className="ge-btn" data-variant="primary" onClick={() => void query.refetch()}>{t.search.retry}</button>
            </div>
          </div>
        )}

        {station && directions && (
          <>
            <header className="ge-page-head pt-2">
              <h1 className="ge-page-title">{name}</h1>
              {station.address && <p className="ge-page-lead">{station.address}</p>}
              {distance && <p className="mt-1 text-sm text-ink-600">{t.navigatePage.distanceFromYou(distance)}</p>}
            </header>

            {warning && (
              <p className="ge-banner" role="status" data-state={station.operationalStatus}>
                <AlertTriangle aria-hidden="true" strokeWidth={1.75} />
                <span>{warning}</span>
              </p>
            )}

            <div className="mt-4"><StationMap station={station} /></div>

            <section className="mt-4" aria-labelledby="nav-start-title">
              <h2 id="nav-start-title" className="ge-sr-only">{t.navigatePage.start}</h2>
              <a className="ge-nav-cta" href={directions} target="_blank" rel="noopener noreferrer" data-testid="start-navigation">
                <Navigation aria-hidden="true" strokeWidth={1.75} />
                {t.navigatePage.start}
                <ExternalLink aria-hidden="true" strokeWidth={1.75} />
              </a>
              <p className="mt-2 text-sm text-ink-600">{freshFix ? t.navigatePage.originDevice : t.navigatePage.originGoogle}</p>
              <p className="mt-1 text-xs text-ink-500">{t.navigatePage.startHint}</p>
            </section>

            <section className="ge-panel mt-4" aria-labelledby="nav-connectors-title">
              <h2 id="nav-connectors-title" className="ge-h2">{t.navigatePage.connectors}</h2>
              {station.connectors.length === 0 ? (
                <p className="mt-1 text-sm text-ink-600">{t.navigatePage.connectorsUnknown}</p>
              ) : (
                <ul className="ge-nav-list">
                  {station.connectors.map((group, index) => (
                    <li key={`${group.kind}-${index}`}>
                      <span className="font-semibold text-ink-900">{t.connectors[TYPE_FOR[group.kind] ?? 'UNKNOWN']}{group.count != null ? ` × ${group.count}` : ''}</span>
                      <span className="ge-tnum">{group.maxPowerKw != null ? formatPower(group.maxPowerKw) : t.navigatePage.powerUnknown}</span>
                      <span>{group.availableCount != null && group.count != null ? t.navigatePage.availableOf(group.availableCount, group.count) : t.navigatePage.availabilityUnknown}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="ge-panel mt-4" aria-labelledby="nav-hours-title">
              <h2 id="nav-hours-title" className="ge-h2">{t.navigatePage.hours}</h2>
              {station.weekdayHours ? (
                <ul className="ge-nav-list">{station.weekdayHours.map(line => <li key={line}>{line}</li>)}</ul>
              ) : (
                <p className="mt-1 text-sm text-ink-600">{t.navigatePage.hoursUnknown}</p>
              )}
            </section>

            <section className="ge-panel mt-4" aria-labelledby="nav-more-title">
              <h2 id="nav-more-title" className="ge-h2">{t.navigatePage.price}</h2>
              <p className="mt-1 text-sm text-ink-600">{t.navigatePage.priceUnknown}</p>
              <h2 className="ge-h2 mt-3">{t.navigatePage.booking}</h2>
              <p className="mt-1 text-sm text-ink-600" data-testid="booking-state">{t.navigatePage.bookingUnavailable}</p>
            </section>

            <footer className="mt-4 text-xs text-ink-500">
              <p>{t.navigatePage.source(formatClockIST(Date.parse(station.retrievedAt)))}</p>
              {station.attributions.map(item => (
                <p key={item.provider}>
                  {item.providerUri ? <a href={item.providerUri} target="_blank" rel="noopener noreferrer" className="underline">{item.provider}</a> : item.provider}
                </p>
              ))}
              {station.googleMapsUri && (
                <p className="mt-1">
                  <a href={station.googleMapsUri} target="_blank" rel="noopener noreferrer" className="underline">{t.navigatePage.viewOnGoogle}</a>
                </p>
              )}
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
