/**
 * Explore (home). Order: header → vehicle card → headline → subhead → search →
 * chips → map preview → section header → charger cards → bottom nav.
 */
import { useCallback, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useExplore } from '@/controllers/useExplore';
import { useScrolledPast, prefersReducedMotion } from '@/hooks/useExploreHooks';
import { useShellSlots, useSkipLink } from '@/components/shell/ShellSlots';
import { HeroMedia } from '@/components/explore/HeroMedia';
import { VehicleSelector } from '@/components/explore/VehicleSelector';
import { SearchBar, type SearchBarHandle } from '@/components/explore/SearchBar';
import { FilterChips } from '@/components/explore/FilterChips';
import { RadiusChips } from '@/components/explore/RadiusChips';
import { MapPreview } from '@/components/explore/MapPreview';
import { SectionHeader } from '@/components/explore/SectionHeader';
import { StatusBanner } from '@/components/explore/StatusBanner';
import { ChargerList } from '@/components/explore/ChargerList';
import { t } from '@/lib/messages';

const CHARGERS_ID = 'nearby-chargers';

export default function Explore() {
  const { announcement, centerLabel } = useExplore();
  const title = centerLabel ? t.discovery.titleNear(centerLabel) : t.discovery.titleDefault;
  const { setHeaderSearch } = useShellSlots();
  const searchRef = useRef<SearchBarHandle>(null);
  const searchAnchor = useRef<HTMLDivElement>(null);
  const searchOutOfView = useScrolledPast(searchAnchor, 64);
  useSkipLink(CHARGERS_ID, t.shell.skipToChargers);

  const focusSearch = useCallback(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    searchRef.current?.focus();
  }, []);

  // Show a compact search in the sticky header only once the hero search scrolls
  // off. Keyed on the boolean alone and torn down on unmount, so it writes shell
  // state only when the on/off state actually flips (never once per render).
  useEffect(() => {
    if (!searchOutOfView) return undefined;
    setHeaderSearch(
      <button type="button" className="ge-compact-search ge-press" onClick={focusSearch}>
        <Search aria-hidden="true" strokeWidth={1.75} />
        {t.search.placeholder}
      </button>,
    );
    return () => setHeaderSearch(null);
  }, [focusSearch, searchOutOfView, setHeaderSearch]);

  return (
    <main id="main-content" tabIndex={-1} className="ge-main outline-none">
      <section className="ge-hero" aria-labelledby="explore-title">
        <div className="ge-container ge-hero__inner">
          <HeroMedia />
          <div className="ge-hero__copy">
            <VehicleSelector />
            <h1 id="explore-title" className="ge-h1">
              <span className="ge-h1__line">{t.hero.titleLine1}</span>
              <span className="ge-h1__line">{t.hero.titleLine2Lead}<span className="ge-h1__accent">{t.hero.titleAccent}</span></span>
            </h1>
            <p className="ge-subhead">
              <span>{t.hero.subLine1}</span>
              <span>{t.hero.subLine2}</span>
            </p>
            <div ref={searchAnchor}>
              <SearchBar ref={searchRef} />
            </div>
            <RadiusChips />
            <FilterChips />
          </div>
        </div>
      </section>

      <div className="ge-container">
        <MapPreview variant="mobile" />
        <div className="ge-results">
          <section id={CHARGERS_ID} aria-labelledby="nearby-title" tabIndex={-1} className="min-w-0 outline-none">
            <SectionHeader titleId="nearby-title" title={title} />
            <StatusBanner />
            <ChargerList onWiderArea={focusSearch} />
          </section>
          <div className="ge-results__map">
            <MapPreview variant="desktop" />
          </div>
        </div>
      </div>

      <div className="ge-sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    </main>
  );
}
