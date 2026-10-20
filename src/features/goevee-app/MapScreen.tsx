/**
 * GoEvee — Map view (demo). Real Google map (browser key) with styled station
 * markers, filter chips, a FAB stack (locate / layers / traffic), a "YOU"
 * marker, and a bottom station card with Navigate + Book Slot. Opens the Map
 * Layers sheet. Mockup-faithful.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crosshair, Layers, List, Navigation, Search, TrafficCone, Zap } from 'lucide-react';
import { useGoogleMapsLoader } from '@/controllers/useGoogleMapsLoader';
import { DEMO_LOCATION, DEMO_STATIONS, directionsUrl, freePercent, type DemoStation } from './demo-data';
import { MapLayersSheet, type MapLayers } from './MapLayersSheet';

const CENTER = { lat: 28.5705, lng: 77.3335 };
const FILTERS = ['Fast (60kW+)', 'CCS2', 'Available Now', '< ₹15/u'] as const;

const DEFAULT_LAYERS: MapLayers = { style: 'standard', traffic: true, amenities: true, heatmap: false, ccs2Only: true };

export default function MapScreen() {
  const navigate = useNavigate();
  const sdk = useGoogleMapsLoader(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<DemoStation>(DEMO_STATIONS[0]);
  const [selected, setSelected] = useState<Record<string, boolean>>({ 'Available Now': true, CCS2: true });
  const [layersOpen, setLayersOpen] = useState(false);
  const [layers, setLayers] = useState<MapLayers>(DEFAULT_LAYERS);
  const activeIndex = useMemo(() => DEMO_STATIONS.findIndex(s => s.id === active.id), [active.id]);

  useEffect(() => {
    if (sdk !== 'ready' || !mapRef.current) return;
    try {
      const maps = window.google.maps;
      const map = new maps.Map(mapRef.current, {
        center: CENTER, zoom: 13, clickableIcons: false, streetViewControl: false,
        mapTypeControl: false, fullscreenControl: false, gestureHandling: 'greedy',
      });
      const markers = DEMO_STATIONS.map(station => {
        const marker = new maps.Marker({ position: station.coords, map, title: station.name });
        marker.addListener('click', () => setActive(station));
        return marker;
      });
      return () => markers.forEach(m => m.setMap(null));
    } catch {
      return undefined;
    }
  }, [sdk]);

  return (
    <main id="main-content" tabIndex={-1} className="gx-map-screen outline-none">
      {/* Top search bar */}
      <div className="gx-map-top">
        <Link to="/app" className="gx-icon-btn gx-icon-btn--sm" aria-label="Back to list"><ArrowLeft aria-hidden="true" strokeWidth={1.75} /></Link>
        <Link to="/app/search" className="gx-map-search">
          <Search aria-hidden="true" strokeWidth={1.75} />
          <span className="gx-map-search__text">
            <strong>{DEMO_LOCATION.label}</strong>
            <small>Within {DEMO_LOCATION.radiusKm} km · {DEMO_STATIONS.length} charging hubs</small>
          </span>
        </Link>
        <Link to="/app" className="gx-solid-ghost gx-map-list" aria-label="List view"><List aria-hidden="true" strokeWidth={1.75} />List</Link>
      </div>

      {/* Filter chips */}
      <div className="gx-map-filters" role="group" aria-label="Filters">
        {FILTERS.map(filter => (
          <button key={filter} type="button" className="gx-fchip" aria-pressed={Boolean(selected[filter])}
            onClick={() => setSelected(s => ({ ...s, [filter]: !s[filter] }))}>
            {filter === 'Fast (60kW+)' && <Zap aria-hidden="true" strokeWidth={2} fill="currentColor" />}
            {selected[filter] && filter !== 'Fast (60kW+)' ? '✓ ' : ''}{filter}
          </button>
        ))}
      </div>

      {/* Map canvas */}
      <div className="gx-map-canvas">
        {sdk === 'ready'
          ? <div ref={mapRef} className="gx-map-el" aria-label="Map of nearby charging stations" role="application" />
          : <div className="gx-map-el gx-map-el--loading" role="status">{sdk === 'error' ? 'Map unavailable' : 'Loading map…'}</div>}

        {/* floating price tooltip for the active station */}
        <div className="gx-map-tip" aria-hidden="true">
          <span className="gx-map-tip__dot" />₹{active.tariffFrom}/kWh · {active.baysFree} free
        </div>

        {/* FAB stack */}
        <div className="gx-fabs">
          <button type="button" className="gx-fab" aria-label="Recenter on your location"><Crosshair aria-hidden="true" strokeWidth={1.75} /></button>
          <button type="button" className="gx-fab" aria-label="Map layers" onClick={() => setLayersOpen(true)}><Layers aria-hidden="true" strokeWidth={1.75} /></button>
          <button type="button" className="gx-fab gx-fab--amber" aria-pressed={layers.traffic} aria-label="Toggle live traffic"
            onClick={() => setLayers(l => ({ ...l, traffic: !l.traffic }))}><TrafficCone aria-hidden="true" strokeWidth={1.75} /></button>
        </div>
      </div>

      {/* Bottom station card */}
      <section className="gx-map-card" aria-label="Selected station">
        <div className="gx-map-card__scroll">
          <article className="gx-map-card__item">
            <div className="gx-map-card__head">
              <div className="gx-map-card__thumb"><img src={active.imageUrl} alt="" width={64} height={64} /><span className="gx-rating">★ {active.rating}</span></div>
              <div className="min-w-0">
                <h2 className="gx-map-card__title">{active.name}</h2>
                <p className="gx-map-card__addr">{active.shortAddress}</p>
                <div className="gx-pills">
                  <span className="gx-pill">{active.distanceKm} km</span>
                  <span className="gx-pill">{active.driveMin} min drive</span>
                </div>
              </div>
            </div>
            <p className="gx-map-card__avail"><span className="gx-avail__dot" data-free={active.baysFree>0} />{active.baysFree} of {active.baysTotal} available<span className="gx-live gx-ml-auto"><span />Live Telemetry</span></p>
            <div className="gx-spec-grid" aria-hidden="true">
              <span><em>Plug</em><b>{active.connectors[0].standard}</b></span>
              <span><em>Speed</em><b>{active.peakKw} kW</b></span>
              <span><em>Rate</em><b>₹{active.tariffFrom}/u</b></span>
              <span><em>Timing</em><b>{active.open24x7 ? '24×7' : 'Ltd'}</b></span>
            </div>
            <div className="gx-map-card__actions">
              <a className="ge-solid-cta" data-variant="ghost" href={directionsUrl(active)} target="_blank" rel="noopener noreferrer">
                <Navigation aria-hidden="true" strokeWidth={2} />Navigate
              </a>
              <button type="button" className="ge-solid-cta gx-grow" onClick={() => navigate(`/app/book/${active.id}`)}>
                Book Slot <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        </div>
        <div className="gx-dots" aria-hidden="true">
          {DEMO_STATIONS.map((s, i) => <span key={s.id} data-on={i === activeIndex} />)}
        </div>
      </section>

      <MapLayersSheet open={layersOpen} value={layers} onApply={next => { setLayers(next); setLayersOpen(false); }} onClose={() => setLayersOpen(false)} />
    </main>
  );
}
