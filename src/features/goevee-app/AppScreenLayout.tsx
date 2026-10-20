/** Layout for the GoEvee app screens: full-bleed content + sticky bottom nav. */
import { Outlet } from 'react-router-dom';
import { AppBottomNav } from './AppBottomNav';

export default function AppScreenLayout() {
  return (
    <div className="gx-app">
      <Outlet />
      <AppBottomNav />
    </div>
  );
}
