import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { Plus } from 'lucide-react';
import { Sheet } from '@/components/primitives/Sheet';
import { useExplore } from '@/controllers/useExplore';
import { t } from '@/lib/messages';
import { BatteryBar } from './BatteryBar';

interface VehicleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VehicleSheet({ open, onOpenChange }: VehicleSheetProps) {
  const { vehicles, vehicle, selectVehicle } = useExplore();
  // Pointer picks close the sheet; arrow-key browsing (synthetic clicks have detail 0) keeps it open.
  const closeOnPointer = (event: MouseEvent) => {
    if (event.detail > 0) window.setTimeout(() => onOpenChange(false), 160);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t.vehicle.sheetTitle} description={t.vehicle.sheetDescription} initialFocus="checked">
      <RadioGroup.Root
        className="flex flex-col gap-1"
        value={vehicle?.id}
        onValueChange={selectVehicle}
        aria-label={t.vehicle.sheetTitle}
      >
        {vehicles.map(item => (
          <RadioGroup.Item key={item.id} value={item.id} className="ge-radio ge-press" onClick={closeOnPointer}>
            <img src={item.imageUrl} alt="" width={152} height={88} className="h-11 w-[4.75rem] flex-none object-contain" />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="ge-radio__label">{item.displayName}</span>
              <span className="ge-vehicle__meta">
                <span className="ge-vehicle__soc">
                  <BatteryBar percent={item.socPercent} />
                  <span className="ge-tnum">{t.vehicle.battery(item.socPercent)}</span>
                </span>
                <span className="ge-vehicle__after ge-dim ge-tnum">{t.vehicle.range(item.rangeKm)}</span>
              </span>
            </span>
            <span className="ge-radio__dot" aria-hidden="true" />
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
      <Link to="/vehicle" className="ge-btn mt-3 w-full" onClick={() => onOpenChange(false)}>
        <Plus aria-hidden="true" strokeWidth={1.75} />
        {t.vehicle.addVehicle}
      </Link>
    </Sheet>
  );
}
