/**
 * Bottom navigation for the GoEvee app screens: Explore · Bookings · Updates ·
 * Profile. Matches the mockup (dashed focus ring on the active-adjacent tab,
 * green active label). Vehicles replaces Bookings on the fleet screen via prop.
 */
import { Link, useLocation } from 'react-router-dom';
import { Bell, CalendarDays, Car, Compass, User } from 'lucide-react';

const TABS = [
  { to: '/app', label: 'Explore', icon: Compass, match: (p: string) => p === '/app' || p.startsWith('/app/map') || p.startsWith('/app/stations') || p.startsWith('/app/search') },
  { to: '/app/bookings', label: 'Bookings', icon: CalendarDays, match: (p: string) => p.startsWith('/app/bookings') || p.startsWith('/app/book') },
  { to: '/app/updates', label: 'Updates', icon: Bell, match: (p: string) => p.startsWith('/app/updates') },
  { to: '/app/profile', label: 'Profile', icon: User, match: (p: string) => p.startsWith('/app/profile') },
];

const VEHICLE_TAB = { to: '/app/vehicles', label: 'Vehicles', icon: Car, match: (p: string) => p.startsWith('/app/vehicles') };

export function AppBottomNav() {
  const { pathname } = useLocation();
  const onVehicles = pathname.startsWith('/app/vehicles');
  const tabs = onVehicles ? [TABS[0], TABS[1], VEHICLE_TAB] : TABS;
  return (
    <nav className="gx-tabbar" aria-label="Primary">
      <ul>
        {tabs.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to}>
              <Link to={to} className="gx-tab" data-active={active} aria-current={active ? 'page' : undefined}>
                <span className="gx-tab__icon" aria-hidden="true"><Icon strokeWidth={active ? 2.25 : 1.75} /></span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
