/** Map view stub in the shell. The interactive map SDK loads only behind the live-map link. */
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useExplore } from '@/controllers/useExplore';
import { MapPreview } from '@/components/explore/MapPreview';
import { t } from '@/lib/messages';

export default function MapPage() {
  const { results, status } = useExplore();
  return (
    <main id="main-content" tabIndex={-1} className="ge-main outline-none">
      <div className="ge-container">
        <header className="ge-page-head">
          <h1 className="ge-page-title">{t.pages.mapTitle}</h1>
          {status === 'ready' && <p className="ge-page-lead">{t.pages.mapIntro(results.length)}</p>}
        </header>
        <div className="ge-page-map mt-4 h-[min(70dvh,40rem)] [&_.ge-map]:h-full [&_.ge-map]:mt-0">
          <MapPreview variant="desktop" />
        </div>
        <Link to="/ev-charger-station" className="ge-btn mt-4" data-variant="primary">
          {t.pages.mapOpenLive}
          <ArrowRight aria-hidden="true" strokeWidth={1.75} />
        </Link>
      </div>
    </main>
  );
}
