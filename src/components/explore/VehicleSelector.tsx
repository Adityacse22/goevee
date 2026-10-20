import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Plus } from 'lucide-react';
import { useExplore } from '@/controllers/useExplore';
import { prefetchWhenIdle } from '@/hooks/useExploreHooks';
import { Skeleton } from '@/components/primitives/Skeleton';
import { t } from '@/lib/messages';
import { BatteryBar } from './BatteryBar';

const loadSheet = () => import('./VehicleSheet');
const VehicleSheet = lazy(loadSheet);

export function VehicleSelector() {
  const { vehicle, vehiclesStatus } = useExplore();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => prefetchWhenIdle([loadSheet]), []);

  if (vehiclesStatus === 'loading') {
    return (
      <div className="ge-vehicle ge-glass" aria-busy="true">
        <span className="ge-sr-only">{t.vehicle.loading}</span>
        <Skeleton className="ge-vehicle__thumb rounded-lg" />
        <span className="ge-vehicle__body">
          <Skeleton className="ge-skel-line" style={{ width: '7.5rem', height: '0.875rem' }} />
          <Skeleton className="ge-skel-line" style={{ width: '10rem' }} />
        </span>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <Link to="/vehicle" className="ge-vehicle ge-glass">
        <span className="ge-vehicle__thumb grid place-items-center rounded-lg bg-mint-100 text-brand-700" aria-hidden="true">
          <Plus className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="ge-vehicle__body">
          <span className="ge-vehicle__name"><span>{t.vehicle.addYourEv}</span></span>
          <span className="ge-vehicle__meta"><span className="ge-dim">{t.vehicle.addYourEvHint}</span></span>
        </span>
      </Link>
    );
  }

  const low = vehicle.socPercent < 15;
  return (
    <>
      <button
        type="button"
        className="ge-vehicle ge-glass"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t.vehicle.accessibleName(vehicle.displayName, vehicle.socPercent, vehicle.rangeKm, low)}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
      >
        <img
          className="ge-vehicle__thumb"
          src={vehicle.imageUrl}
          alt=""
          width={152}
          height={88}
          decoding="async"
        />
        <span className="ge-vehicle__body">
          <span className="ge-vehicle__name">
            <span>{vehicle.displayName}</span>
            <ChevronDown aria-hidden="true" strokeWidth={1.75} />
          </span>
          <span className="ge-vehicle__meta">
            <span className="ge-vehicle__soc">
              <BatteryBar percent={vehicle.socPercent} />
              <span className="ge-tnum">{t.vehicle.battery(vehicle.socPercent)}</span>
            </span>
            {low
              ? <span className="ge-vehicle__after ge-low">{t.vehicle.lowBattery}</span>
              : <span className="ge-vehicle__after ge-dim ge-tnum">{t.vehicle.range(vehicle.rangeKm)}</span>}
          </span>
        </span>
      </button>
      {mounted && (
        <Suspense fallback={null}>
          <VehicleSheet open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  );
}
