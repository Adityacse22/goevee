import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useExplore } from '@/controllers/useExplore';
import { prefetchWhenIdle } from '@/hooks/useExploreHooks';
import { t } from '@/lib/messages';

const loadSort = () => import('./SortSheet');
const SortSheet = lazy(loadSort);

interface SectionHeaderProps {
  titleId: string;
  title: string;
  /** Hide "See all" on the full list page. */
  seeAll?: boolean;
  headingLevel?: 'h1' | 'h2';
}

export function SectionHeader({ titleId, title, seeAll = true, headingLevel = 'h2' }: SectionHeaderProps) {
  const { sort, filterQuery, status, search, results, radiusKm } = useExplore();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => prefetchWhenIdle([loadSort]), []);
  const Heading = headingLevel;
  const hasResults = status === 'ready';

  return (
    <div className="ge-section-head">
      <div className="min-w-0">
        <Heading id={titleId} className={headingLevel === 'h1' ? 'ge-page-title' : 'ge-h2'}>{title}</Heading>
        <div className="ge-meta">
          {/* Count is what was returned, not the total in the area. */}
          <span className="ge-tnum" data-testid="results-summary">
            {t.discovery.summary(hasResults ? results.length : 0, hasResults ? search.radiusKm : radiusKm)}
          </span>
          <span className="ge-meta__divider" aria-hidden="true" />
          <button
            type="button"
            className="ge-meta__sort"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              setMounted(true);
              setOpen(true);
            }}
          >
            {t.list.sortedBy[sort]}
          </button>
        </div>
        <p className="ge-meta ge-meta--note">{t.discovery.distanceNote}</p>
      </div>
      {seeAll && (
        <Link to={`/chargers${filterQuery}`} className="ge-see-all ge-press" aria-label={t.list.seeAllLabel}>
          {t.list.seeAll}
          <ChevronRight aria-hidden="true" strokeWidth={1.75} />
        </Link>
      )}
      {mounted && (
        <Suspense fallback={null}>
          <SortSheet open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </div>
  );
}
