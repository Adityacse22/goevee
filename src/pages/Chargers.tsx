/** "See all" — the full filtered list with the same chips and sort. */
import { useExplore } from '@/controllers/useExplore';
import { FilterChips } from '@/components/explore/FilterChips';
import { RadiusChips } from '@/components/explore/RadiusChips';
import { SectionHeader } from '@/components/explore/SectionHeader';
import { StatusBanner } from '@/components/explore/StatusBanner';
import { ChargerList } from '@/components/explore/ChargerList';
import { t } from '@/lib/messages';

export default function Chargers() {
  const { announcement } = useExplore();
  return (
    <main id="main-content" tabIndex={-1} className="ge-main outline-none">
      <div className="ge-container max-w-3xl">
        <SectionHeader titleId="chargers-title" title={t.list.titleAll} seeAll={false} headingLevel="h1" />
        <RadiusChips />
        <FilterChips />
        <StatusBanner />
        <ChargerList />
      </div>
      <div className="ge-sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    </main>
  );
}
