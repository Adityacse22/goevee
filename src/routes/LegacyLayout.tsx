/**
 * Layout for pages that still use the original dark design. Loaded lazily so
 * framer-motion and the Google search provider stay off the Explore bundle.
 */
import { useLayoutEffect, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { SearchProvider } from '@/controllers/useSearchController';

export default function LegacyLayout({ children }: { children?: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove('ge-shell');
    // Legacy pages are dark-only: restore their colour scheme and browser bar colour.
    root.style.removeProperty('color-scheme');
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.setAttribute('content', '#09090b'));
  }, []);
  return (
    <SearchProvider>
      <MotionConfig reducedMotion="user">
        <a className="skip-link" href="#main-content">Skip to content</a>
        {children ?? <Outlet />}
      </MotionConfig>
    </SearchProvider>
  );
}
