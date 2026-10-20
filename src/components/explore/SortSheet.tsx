import type { MouseEvent } from 'react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { Sheet } from '@/components/primitives/Sheet';
import { useExplore } from '@/controllers/useExplore';
import { t } from '@/lib/messages';
import type { SortKey } from '@/lib/types';

const ORDER: SortKey[] = ['distance', 'price', 'power', 'availability'];

export default function SortSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { sort, setSort } = useExplore();
  const closeOnPointer = (event: MouseEvent) => {
    if (event.detail > 0) window.setTimeout(() => onOpenChange(false), 160);
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t.list.sortTitle} initialFocus="checked">
      <RadioGroup.Root
        className="flex flex-col gap-1"
        value={sort}
        onValueChange={value => setSort(value as SortKey)}
        aria-label={t.list.sortTitle}
      >
        {ORDER.map(key => (
          <RadioGroup.Item key={key} value={key} className="ge-radio ge-press" onClick={closeOnPointer}>
            <span className="ge-radio__label">{t.list.sortOptions[key]}</span>
            <span className="ge-radio__dot" aria-hidden="true" />
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </Sheet>
  );
}
