import type { ReactNode } from 'react';

interface SpecItemProps {
  icon: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  muted?: boolean;
}

/** Icon + value over an optional sub-label, e.g. "60 kW" / "(Fast)". */
export function SpecItem({ icon, value, sub, muted = false }: SpecItemProps) {
  return (
    <div className="ge-spec" data-muted={muted}>
      {icon}
      <span className="ge-spec__text">
        <span className="ge-spec__value ge-tnum">{value}</span>
        {sub != null && <span className="ge-spec__sub">{sub}</span>}
      </span>
    </div>
  );
}
