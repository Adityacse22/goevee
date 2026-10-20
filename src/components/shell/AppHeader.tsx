import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { useAuth } from '@/controllers/useAuth';
import { prefetchWhenIdle } from '@/hooks/useExploreHooks';
import { t } from '@/lib/messages';
import { GoEveeLockup } from '@/components/icons/GoEveeLogo';
import { IconButton } from './IconButton';
import { ThemeToggle } from './ThemeToggle';
import { PRIMARY_TABS } from './BottomNav';
import { useShellSlots } from './ShellSlots';

const loadMenu = () => import('./MenuSheet');
const MenuSheet = lazy(loadMenu);

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toLocaleUpperCase('en-IN')).join('') || 'G';

export function AppHeader() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { headerSearch } = useShellSlots();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    const update = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => setScrolled(window.scrollY > 8));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => prefetchWhenIdle([loadMenu]), []);

  return (
    <header className="ge-header" data-scrolled={scrolled}>
      <div className="ge-container ge-header__bar">
        {/* Accessible name "GoEvee home" comes from the wordmark plus hidden text, so it starts with the visible label. */}
        <Link to="/" className="ge-logo">
          <GoEveeLockup tagline={t.brand.tagline} />
        </Link>
        <nav className="ge-header__nav" aria-label={t.shell.primaryNav}>
          {PRIMARY_TABS.filter(tab => tab.to !== '/profile').map(tab => (
            <Link key={tab.to} to={tab.to} className="ge-header__link" aria-current={tab.match(pathname) ? 'page' : undefined}>
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="ge-header__search">{headerSearch}</div>
        <div className="ge-header__actions">
          <ThemeToggle />
          <Link to={user ? '/profile' : '/login'} className="ge-icon-btn" aria-label={user ? t.shell.account(user.fullName || user.email) : t.shell.signIn}>
            <span className="ge-icon-btn__face" aria-hidden="true">
              {user ? <span className="ge-avatar">{initials(user.fullName || user.email)}</span> : <User strokeWidth={1.75} />}
            </span>
          </Link>
          <IconButton
            label={t.shell.menu}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuMounted(true);
              setMenuOpen(true);
            }}
          >
            <Menu strokeWidth={1.75} />
          </IconButton>
        </div>
      </div>
      {menuMounted && (
        <Suspense fallback={null}>
          <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
        </Suspense>
      )}
    </header>
  );
}
