import { AlertTriangle, CloudOff, LocateFixed, RefreshCw } from 'lucide-react';
import { useExplore } from '@/controllers/useExplore';
import { isImprecise } from '@/lib/discovery/geolocation';
import { formatClockIST } from '@/lib/format';
import { t } from '@/lib/messages';

/** Offline, partial-coverage and accuracy notices. Never replaces an error with "no chargers". */
export function StatusBanner() {
  const { isOffline, snapshotTime, retry, status, search, deviceLocation, searchCenter } = useExplore();
  const notices = [];
  if (isOffline && snapshotTime) {
    notices.push(
      <p key="offline" className="ge-banner" role="status">
        <CloudOff aria-hidden="true" strokeWidth={1.75} />
        <span>{t.list.offline(formatClockIST(snapshotTime))}</span>
      </p>,
    );
  }
  if (status === 'ready' && search.partial) {
    notices.push(
      <p key="partial" className="ge-banner" role="status" data-state="partial">
        <AlertTriangle aria-hidden="true" strokeWidth={1.75} />
        <span>{t.discovery.partial}</span>
        <button type="button" onClick={retry}>{t.search.retry}</button>
      </p>,
    );
  } else if (status === 'ready' && search.coverage?.mayOmitCloserStations) {
    notices.push(
      <p key="omit" className="ge-banner" role="status" data-state="may-omit">
        <RefreshCw aria-hidden="true" strokeWidth={1.75} />
        <span>{t.discovery.mayOmitNote}</span>
      </p>,
    );
  }
  if (searchCenter?.source === 'device' && isImprecise(deviceLocation)) {
    notices.push(
      <p key="imprecise" className="ge-banner" role="status" data-state="imprecise">
        <LocateFixed aria-hidden="true" strokeWidth={1.75} />
        <span>{t.discovery.locate.imprecise(Math.round((deviceLocation?.accuracyM ?? 0) / 1000))}</span>
      </p>,
    );
  }
  return notices.length ? <>{notices}</> : null;
}
