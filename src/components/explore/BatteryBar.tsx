export type BatteryLevel = 'green' | 'amber' | 'red';

export function batteryLevel(percent: number): BatteryLevel {
  if (percent < 15) return 'red';
  if (percent < 30) return 'amber';
  return 'green';
}

/** 48×8 state-of-charge pill. Decorative: the adjacent text states the percentage. */
export function BatteryBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <span className="ge-battery" data-level={batteryLevel(clamped)} aria-hidden="true">
      <span className="ge-battery__fill" style={{ width: `${clamped}%` }} />
    </span>
  );
}
