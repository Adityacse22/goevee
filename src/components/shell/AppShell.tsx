/**
 * App shell for the redesigned pages: sticky header, page content, bottom nav.
 * Marks <html> with `ge-shell` so global styles switch from the legacy dark
 * theme to GoEvee tokens (index.html sets it before first paint).
 */
import type { ReactNode } from 'react';
import { useIsomorphicLayoutEffect } from '@/hooks/useExploreHooks';
import { applyTheme, currentTheme } from '@/lib/theme';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { ShellSlotsProvider, useShellSlots } from './ShellSlots';

function SkipLink() {
  const { skip } = useShellSlots();
  return <a className="ge-skip" href={`#${skip.target}`}>{skip.label}</a>;
}

export function AppShell({ children }: { children: ReactNode }) {
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('ge-shell');
    root.classList.remove('light-mode');
    // Re-apply theme colour + color-scheme when arriving from a legacy page.
    applyTheme(currentTheme());
    return () => root.classList.remove('ge-shell');
  }, []);

  return (
    <ShellSlotsProvider>
      <div className="ge-app">
        <SkipLink />
        <AppHeader />
        {children}
        <BottomNav />
      </div>
    </ShellSlotsProvider>
  );
}
