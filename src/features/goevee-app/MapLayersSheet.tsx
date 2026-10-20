/**
 * GoEvee — Map Layers bottom sheet (demo). Choose base map style and toggle
 * real-time overlays. Mockup-faithful. Focus-trapped, Escape closes.
 */
import { useEffect, useRef } from 'react';
import { Coffee, Layers, Moon, Satellite, Share2, TrafficCone, X, Zap } from 'lucide-react';

export type MapStyle = 'standard' | 'satellite' | 'dark';
export interface MapLayers {
  style: MapStyle;
  traffic: boolean;
  amenities: boolean;
  heatmap: boolean;
  ccs2Only: boolean;
}

const STYLES: { id: MapStyle; label: string; icon: typeof Satellite }[] = [
  { id: 'standard', label: 'Standard', icon: Layers },
  { id: 'satellite', label: 'Satellite', icon: Satellite },
  { id: 'dark', label: 'Dark', icon: Moon },
];

const TOGGLES = [
  { key: 'traffic', icon: TrafficCone, title: 'Live Traffic', desc: 'Congestion on access roads', tone: 'amber' },
  { key: 'amenities', icon: Coffee, title: 'Amenities', desc: 'Cafes & washrooms near hubs', tone: 'green' },
  { key: 'heatmap', icon: Share2, title: 'Demand Heatmap', desc: 'High station traffic zones', tone: 'muted' },
  { key: 'ccs2Only', icon: Zap, title: 'Highlight CCS2 Only', desc: 'Match your registered vehicle', tone: 'green' },
] as const;

export function MapLayersSheet({ open, value, onApply, onClose }: {
  open: boolean; value: MapLayers; onApply: (next: MapLayers) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const draft = useRef<MapLayers>(value);
  draft.current = value;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, open]);

  if (!open) return null;
  const set = (patch: Partial<MapLayers>) => onApply.length === 0 ? undefined : (draft.current = { ...draft.current, ...patch });

  return (
    <div className="gx-sheet-scrim" onPointerDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={ref} className="gx-sheet" role="dialog" aria-modal="true" aria-labelledby="gx-layers-title">
        <div className="gx-sheet__head">
          <span className="gx-sheet__icon" aria-hidden="true"><Layers strokeWidth={2} /></span>
          <div className="min-w-0">
            <h2 id="gx-layers-title" className="gx-sheet__title">Map Layers</h2>
            <p className="gx-sheet__sub">Customise view & insights</p>
          </div>
          <button type="button" className="gx-sheet__close" aria-label="Close" onClick={onClose}><X aria-hidden="true" strokeWidth={1.75} /></button>
        </div>

        <LayersBody value={value} onApply={onApply} onClose={onClose} />
      </div>
    </div>
  );
}

function LayersBody({ value, onApply, onClose }: { value: MapLayers; onApply: (next: MapLayers) => void; onClose: () => void }) {
  const ref = useRef<MapLayers>(value);
  const rerender = useRerender();
  const draft = ref.current;
  const patch = (p: Partial<MapLayers>) => { ref.current = { ...ref.current, ...p }; rerender(); };

  return (
    <>
      <div className="gx-sheet__section">
        <div className="gx-sheet__label"><span>MAP STYLE</span><em>Base palette</em></div>
        <div className="gx-style-grid">
          {STYLES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className="gx-style" data-mode={id} aria-pressed={draft.style === id} onClick={() => patch({ style: id })}>
              <span className="gx-style__icon"><Icon aria-hidden="true" strokeWidth={1.75} /></span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="gx-sheet__section">
        <div className="gx-sheet__label"><span>OVERLAYS</span><em>Real-time data</em></div>
        <ul className="gx-toggle-list">
          {TOGGLES.map(({ key, icon: Icon, title, desc, tone }) => (
            <li key={key} className="gx-toggle">
              <span className="gx-toggle__icon" data-tone={tone}><Icon aria-hidden="true" strokeWidth={1.75} /></span>
              <span className="gx-toggle__text"><b>{title}</b><small>{desc}</small></span>
              <button type="button" role="switch" aria-checked={draft[key]} aria-label={title} className="gx-switch" data-on={draft[key]}
                onClick={() => patch({ [key]: !draft[key] } as Partial<MapLayers>)}><span /></button>
            </li>
          ))}
        </ul>
      </div>

      <div className="gx-sheet__foot">
        <button type="button" className="gx-solid-ghost gx-sheet__reset" onClick={() => { ref.current = { style: 'standard', traffic: true, amenities: true, heatmap: false, ccs2Only: true }; rerender(); }}>Reset</button>
        <button type="button" className="ge-solid-cta gx-grow" onClick={() => onApply(ref.current)}>Apply View ✓</button>
      </div>
    </>
  );
}

function useRerender() {
  const ref = useRef(0);
  const [, set] = useReducerLike();
  return () => { ref.current += 1; set(ref.current); };
}
function useReducerLike(): [number, (n: number) => void] {
  const [n, setN] = useStateShim(0);
  return [n, setN];
}
import { useState as useStateShim } from 'react';
