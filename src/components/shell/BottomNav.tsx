import { Link, useLocation } from 'react-router-dom';
import { Bell, CalendarDays, Compass, User } from 'lucide-react';
import { t } from '@/lib/messages';

export const PRIMARY_TABS = [
  { to: '/', label: t.shell.nav.explore, icon: Compass, match: (path: string) => path === '/' || path === '/chargers' || path === '/map' },
  { to: '/bookings', label: t.shell.nav.bookings, icon: CalendarDays, match: (path: string) => path.startsWith('/bookings') },
  { to: '/updates', label: t.shell.nav.updates, icon: Bell, match: (path: string) => path.startsWith('/updates') },
  { to: '/profile', label: t.shell.nav.profile, icon: User, match: (path: string) => path.startsWith('/profile') },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="ge-bottom-nav" aria-label={t.shell.primaryNav}>
      <ul>
        {PRIMARY_TABS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to}>
              <Link to={to} className="ge-tab" aria-current={active ? 'page' : undefined}>
                <span className="ge-tab__icon" aria-hidden="true"><Icon strokeWidth={active ? 2 : 1.75} /></span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
