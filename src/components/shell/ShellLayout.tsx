import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { ExploreProvider } from '@/controllers/useExplore';
import { AppShell } from './AppShell';

/** Route layout for redesigned pages. Header, nav and Explore state persist across them. */
export default function ShellLayout({ children }: { children?: ReactNode }) {
  return (
    <ExploreProvider>
      <AppShell>{children ?? <Outlet />}</AppShell>
    </ExploreProvider>
  );
}
