/**
 * /stations/:stationId — GoEvee aggregator stations open in the new shell;
 * any other id falls through to the legacy API-backed details page.
 */
import { lazy, Suspense, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import ShellLayout from '@/components/shell/ShellLayout';
import { useExplore } from '@/controllers/useExplore';
import { AvailabilityBadge } from '@/components/explore/AvailabilityBadge';
import { LiveIndicator } from '@/components/explore/LiveIndicator';
import { badgeState, freshness, powerTier } from '@/lib/filters';
import { formatAddress, formatPower, formatPriceValue } from '@/lib/format';
import { findMockStation } from '@/lib/mock-data';
import { t } from '@/lib/messages';

const LegacyLayout = lazy(() => import('@/routes/LegacyLayout'));
const StationDetails = lazy(() => import('@/pages/StationDetails'));

function StationStub({ id }: { id: string }) {
  const { stations, status, now } = useExplore();
  const { hash } = useLocation();
  const station = stations.find(item => item.id === id || item.slug === id);

  useEffect(() => {
    if (hash === '#slots' && station) document.getElementById('slots')?.scrollIntoView();
  }, [hash, station]);

  return (
    <main id="main-content" tabIndex={-1} className="ge-main outline-none">
      <div className="ge-container max-w-2xl">
        <Link to="/" className="ge-back mt-2"><ChevronLeft aria-hidden="true" strokeWidth={1.75} />{t.station.back}</Link>
        {status !== 'ready' && <p className="ge-page-lead" role="status">{t.map.loading}</p>}
        {status === 'ready' && !station && <h1 className="ge-page-title mt-4">{t.station.notFound}</h1>}
        {station && (
          <>
            <header className="ge-page-head pt-2">
              <h1 className="ge-page-title">{station.name}</h1>
              <p className="ge-page-lead">{formatAddress(station.address)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <AvailabilityBadge station={station} state={badgeState(station, now)} />
                <LiveIndicator freshness={freshness(station, now)} />
                <span className="text-sm font-semibold text-ink-900 ge-tnum">₹{formatPriceValue(station.pricePerKwh)}{t.card.perKwh}</span>
              </div>
            </header>
            <section id="slots" className="ge-panel scroll-mt-24" aria-labelledby="slots-title">
              <h2 id="slots-title" className="ge-h2">{t.station.slots}</h2>
              <p className="mt-1 text-sm text-ink-600">{t.station.slotsIntro}</p>
              <ul className="mt-3">
                {station.connectors.map((connector, index) => (
                  <li key={connector.id} className="ge-slot-row">
                    <span className="flex flex-col">
                      <span className="text-[0.9375rem] font-semibold text-ink-900">{t.station.connector(index + 1)} · {t.connectors[connector.type]}</span>
                      <span className="text-[0.8125rem] text-ink-600 ge-tnum">{connector.current} · {formatPower(connector.maxPowerKw)} ({t.powerTiers[powerTier(connector)]})</span>
                    </span>
                    <span className="ge-badge" data-state={connector.status === 'AVAILABLE' ? 'available' : connector.status === 'CHARGING' || connector.status === 'RESERVED' ? 'full' : 'offline'}>
                      {t.station.statuses[connector.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function StationRoute() {
  const { stationId = '' } = useParams();
  if (findMockStation(stationId)) {
    return (
      <ShellLayout>
        <StationStub id={stationId} />
      </ShellLayout>
    );
  }
  return (
    <Suspense fallback={null}>
      <LegacyLayout>
        <StationDetails />
      </LegacyLayout>
    </Suspense>
  );
}
