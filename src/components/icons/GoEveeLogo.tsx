import { useId } from 'react';

/** Pin mark: deep emerald gradient, white inner disc, emerald bolt, ground shadow. */
export function GoEveeMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 28 34" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-pin`} x1="6" y1="2" x2="22" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0E7A4F" />
          <stop offset="1" stopColor="#16A34A" />
        </linearGradient>
      </defs>
      <ellipse cx="14" cy="32.4" rx="5.2" ry="1.3" fill="#0F172A" opacity="0.16" />
      <path
        d="M14 1.2C7.48 1.2 2.2 6.34 2.2 12.68c0 8.27 10.31 16.86 11.17 17.56a1 1 0 0 0 1.26 0C15.49 29.54 25.8 20.95 25.8 12.68 25.8 6.34 20.52 1.2 14 1.2Z"
        fill={`url(#${id}-pin)`}
      />
      <circle cx="14" cy="12.6" r="7.4" fill="#FFFFFF" />
      <path d="M15.3 7.4 10.6 13.5h3.1l-1 4.9 4.7-6.2h-3.1l1-4.8Z" fill="#16A34A" />
    </svg>
  );
}

/** Logo lockup: mark + "GoEvee" wordmark + tagline (tagline hides under 340px). */
export function GoEveeLockup({ tagline }: { tagline: string }) {
  return (
    <>
      <GoEveeMark className="ge-logo__mark" />
      <span className="ge-logo__text">
        <span className="ge-logo__word">Go<span>Evee</span><span className="ge-sr-only"> home</span></span>
        <span className="ge-logo__tagline" aria-hidden="true">{tagline}</span>
      </span>
    </>
  );
}
