/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { t } from '@/lib/messages';

interface SkipLink {
  target: string;
  label: string;
}

interface ShellSlotsValue {
  skip: SkipLink;
  setSkip: (skip: SkipLink | null) => void;
  headerSearch: ReactNode;
  setHeaderSearch: (node: ReactNode) => void;
}

const DEFAULT_SKIP: SkipLink = { target: 'main-content', label: t.shell.skipToContent };
const ShellSlotsContext = createContext<ShellSlotsValue | null>(null);

export function ShellSlotsProvider({ children }: { children: ReactNode }) {
  const [skip, setSkipState] = useState<SkipLink>(DEFAULT_SKIP);
  const [headerSearch, setHeaderSearch] = useState<ReactNode>(null);
  // Stable setters: effects in pages depend on these, so a changing identity
  // would re-run those effects every render and loop (setState-in-effect).
  const setSkip = useCallback((next: SkipLink | null) => setSkipState(next ?? DEFAULT_SKIP), []);
  const value = useMemo<ShellSlotsValue>(() => ({
    skip,
    setSkip,
    headerSearch,
    setHeaderSearch,
  }), [headerSearch, setSkip, skip]);
  return <ShellSlotsContext.Provider value={value}>{children}</ShellSlotsContext.Provider>;
}

export function useShellSlots(): ShellSlotsValue {
  const value = useContext(ShellSlotsContext);
  if (!value) throw new Error('useShellSlots must be used inside ShellSlotsProvider');
  return value;
}

/** Lets a page set the shell's skip-link target for as long as it is mounted. */
export function useSkipLink(target: string, label: string) {
  const { setSkip } = useShellSlots();
  useEffect(() => {
    setSkip({ target, label });
    return () => setSkip(null);
  }, [label, setSkip, target]);
}
