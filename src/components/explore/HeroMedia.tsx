/**
 * Decorative hero scene behind the header, vehicle card and headline.
 * Day and night variants; only the one matching the active theme loads eagerly.
 */
export function HeroMedia() {
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const eager = { loading: 'eager' as const, fetchpriority: 'high' };
  const deferred = { loading: 'lazy' as const, fetchpriority: 'low' };
  return (
    <div className="ge-hero-media" aria-hidden="true">
      <img
        className="ge-hero-media__day"
        src="/mock/hero-plaza-day.svg"
        alt=""
        width={800}
        height={600}
        decoding="async"
        {...(dark ? deferred : eager)}
      />
      <img
        className="ge-hero-media__night"
        src="/mock/hero-plaza-night.svg"
        alt=""
        width={800}
        height={600}
        decoding="async"
        {...(dark ? eager : deferred)}
      />
    </div>
  );
}
