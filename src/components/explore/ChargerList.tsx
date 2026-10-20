import { useRef } from 'react';
import { LocateFixed, RefreshCw, Search, X } from 'lucide-react';
import { useExplore } from '@/controllers/useExplore';
import { Skeleton } from '@/components/primitives/Skeleton';
import { activeFilterCount } from '@/lib/filters';
import { t } from '@/lib/messages';
import { RADIUS_OPTIONS_KM } from '../../../shared/discovery';
import { ChargerCard } from './ChargerCard';

/** Same geometry as a phone card so nothing shifts when data arrives. */
function CardSkeleton() {
  return (
    <div className="ge-card" aria-hidden="true">
      <div className="ge-card__body">
        <Skeleton className="ge-card__media" />
        <div className="ge-card__main" style={{ rowGap: '0.5rem' }}>
          <Skeleton className="ge-skel-line" style={{ gridArea: 'title', width: '80%', height: '1rem' }} />
          <Skeleton className="ge-skel-line" style={{ gridArea: 'dist', width: '2.5rem' }} />
          <Skeleton className="ge-skel-line" style={{ gridArea: 'addr', width: '60%' }} />
          <Skeleton className="ge-skel-line" style={{ gridArea: 'status', width: '8.5rem', height: '1.625rem' }} />
        </div>
        <div className="ge-card__specs ge-specs">
          {[0, 1, 2, 3].map(key => <Skeleton key={key} className="ge-skel-line" style={{ width: '3.75rem', height: '2.25rem', borderRadius: '0.5rem' }} />)}
        </div>
      </div>
      <Skeleton className="ge-cta" style={{ borderRadius: '0.75rem' }} />
    </div>
  );
}

function Skeletons({ message }: { message: string }) {
  return (
    <div className="ge-list" aria-busy="true">
      <p className="ge-list__status" role="status">{message}</p>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function ChargerList({ onWiderArea }: { onWiderArea?: () => void }) {
  const { results, stations, status, filters, clearFilters, retry, search, radiusKm, setRadiusKm, centerLabel, requestDeviceLocation, locateState } = useExplore();
  // The first list replaces its skeletons in place; only later filter results fade in.
  const firstSignature = useRef<string | null>(null);

  if (status === 'idle') {
    return (
      <div className="ge-empty" data-state="no-location">
        <h3>{t.discovery.noCenterTitle}</h3>
        <p>{t.discovery.noCenterBody}</p>
        <div className="ge-empty__actions">
          <button type="button" className="ge-btn" data-variant="primary" onClick={requestDeviceLocation} disabled={locateState === 'locating'}>
            <LocateFixed aria-hidden="true" strokeWidth={1.75} />
            {t.discovery.useMyLocation}
          </button>
          {onWiderArea && (
            <button type="button" className="ge-btn" onClick={onWiderArea}>
              <Search aria-hidden="true" strokeWidth={1.75} />
              {t.discovery.searchPlace}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'locating') return <Skeletons message={t.discovery.findingLocation} />;
  if (status === 'loading') return <Skeletons message={t.discovery.loadingStations(centerLabel ?? t.discovery.yourCurrentLocation)} />;

  if (status === 'error') {
    const kind = search.errorKind ?? 'NETWORK';
    return (
      <div className="ge-empty" role="alert" data-state="error" data-error={kind}>
        <h3>{t.discovery.errorTitle}</h3>
        <p>{t.discovery.errors[kind]}</p>
        <div className="ge-empty__actions">
          <button type="button" className="ge-btn" data-variant="primary" onClick={retry}>
            <RefreshCw aria-hidden="true" strokeWidth={1.75} />
            {t.search.retry}
          </button>
        </div>
      </div>
    );
  }

  // The provider returned nothing valid inside the selected radius.
  if (stations.length === 0) {
    const larger = RADIUS_OPTIONS_KM.find(option => option > radiusKm);
    return (
      <div className="ge-empty" role="status" data-state="empty">
        <h3>{t.discovery.emptyRadius(radiusKm)}</h3>
        <p>{t.discovery.emptyRadiusBody}</p>
        <div className="ge-empty__actions">
          {larger && (
            <button type="button" className="ge-btn" data-variant="primary" onClick={() => setRadiusKm(larger)}>
              {t.discovery.tryRadius(larger)}
            </button>
          )}
          {onWiderArea && (
            <button type="button" className="ge-btn" onClick={onWiderArea}>
              <Search aria-hidden="true" strokeWidth={1.75} />
              {t.discovery.searchPlace}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="ge-empty" data-state="filtered-empty">
        <h3>{t.list.emptyTitle}</h3>
        <p>{t.list.emptyBody}</p>
        <div className="ge-empty__actions">
          {activeFilterCount(filters) > 0 && (
            <button type="button" className="ge-btn" data-variant="primary" onClick={clearFilters}>
              <X aria-hidden="true" strokeWidth={1.75} />
              {t.list.clearFilters}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Remount on membership change so new results fade in with a short stagger.
  const signature = results.map(station => station.id).join('|');
  firstSignature.current ??= signature;
  if (signature !== firstSignature.current) firstSignature.current = '';
  return (
    <>
      <ul className="ge-list" key={signature} data-animate={firstSignature.current === ''}>
        {results.map((station, index) => (
          <li key={station.id} style={{ animationDelay: `${Math.min(index, 5) * 30}ms` }}>
            <ChargerCard station={station} primary={index === 0} eager={index === 0} />
          </li>
        ))}
      </ul>
      {search.count >= search.limit && <p className="ge-list__note">{t.discovery.capNote(search.limit, radiusKm)}</p>}
      <p className="ge-attribution">{t.discovery.attribution}</p>
    </>
  );
}
