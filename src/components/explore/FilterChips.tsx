import { useRef, useState, type ReactNode } from 'react';
import { Gauge, Plug, Zap } from 'lucide-react';
import { useExplore, type QuickFilter } from '@/controllers/useExplore';
import { useIsomorphicLayoutEffect } from '@/hooks/useExploreHooks';
import { Ccs2Icon } from '@/components/icons/Ccs2Icon';
import { t } from '@/lib/messages';

interface ChipDef {
  id: QuickFilter;
  label: string;
  pressed: boolean;
  icon: (pressed: boolean) => ReactNode;
}

export function FilterChips() {
  const { filters, toggleFilter, chipConnector } = useExplore();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;
    const measure = () => setOverflow(scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft > 1);
    measure();
    scroller.addEventListener('scroll', measure, { passive: true });
    const observer = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
    observer?.observe(scroller);
    return () => {
      scroller.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [chipConnector]);

  const chips: ChipDef[] = [
    {
      id: 'available',
      label: t.filters.available,
      pressed: filters.available,
      icon: pressed => <Zap aria-hidden="true" strokeWidth={1.75} fill={pressed ? 'currentColor' : 'none'} />,
    },
    ...(chipConnector
      ? [{
        id: 'connector' as const,
        label: t.connectors[chipConnector],
        pressed: filters.connector != null,
        icon: () => (chipConnector === 'CCS2' ? <Ccs2Icon /> : <Plug aria-hidden="true" strokeWidth={1.75} />),
      }]
      : []),
    { id: 'fast', label: t.filters.fast, pressed: filters.minKw != null, icon: () => <Gauge aria-hidden="true" strokeWidth={1.75} /> },
  ];

  return (
    <div className="ge-chips-wrap" data-overflow={overflow}>
      <div ref={scrollerRef} className="ge-chips" role="group" aria-label={t.filters.group}>
        {chips.map(chip => (
          <button
            key={chip.id}
            type="button"
            className="ge-chip"
            aria-pressed={chip.pressed}
            onClick={() => {
              toggleFilter(chip.id);
              if ('vibrate' in navigator) navigator.vibrate?.(10);
            }}
          >
            {chip.icon(chip.pressed)}
            <span className="ge-chip__label" data-text={chip.label}><span>{chip.label}</span></span>
          </button>
        ))}
      </div>
      <span className="ge-chips-fade" aria-hidden="true" />
    </div>
  );
}
