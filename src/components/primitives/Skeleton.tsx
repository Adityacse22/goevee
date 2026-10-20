import type { CSSProperties } from 'react';

/** Shimmering placeholder. Geometry comes from the caller so it matches the final UI. */
export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`ge-skel ${className}`} style={{ display: 'block', ...style }} />;
}
