/**
 * GoEvee — Location permission prompt (demo). Explains why location is used,
 * lists benefits, and offers Enable / search manually. Mockup-faithful.
 * Honest: it does not claim to have the location until granted.
 */
import { useNavigate } from 'react-router-dom';
import { Check, Crosshair, Lock, MapPinned, Zap } from 'lucide-react';

const BENEFITS = [
  { icon: Zap, text: 'Instant distance & ETA to charging hubs' },
  { icon: Check, text: 'Live stall availability along your route' },
  { icon: Lock, text: 'Your location data is never sold or shared' },
];

export default function LocationPermissionScreen() {
  const navigate = useNavigate();
  const enable = () => {
    if ('geolocation' in navigator) navigator.geolocation.getCurrentPosition(() => navigate('/app'), () => navigate('/app/search'), { timeout: 10000, maximumAge: 60000 });
    else navigate('/app/search');
  };
  return (
    <main id="main-content" tabIndex={-1} className="gx-perm outline-none">
      <div className="gx-perm__card" role="dialog" aria-modal="true" aria-labelledby="gx-perm-title">
        <span className="gx-perm__icon" aria-hidden="true"><MapPinned strokeWidth={2} /><em><Zap strokeWidth={2.5} /></em></span>
        <h1 id="gx-perm-title" className="gx-perm__title">Find chargers near you automatically</h1>
        <p className="gx-perm__body">GoEvee uses your location to calculate accurate driving distance, check connector availability along your route, and direct you to the fastest open hubs.</p>
        <ul className="gx-perm__list">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text}><span className="gx-perm__check" aria-hidden="true"><Icon strokeWidth={2} /></span>{text}</li>
          ))}
        </ul>
        <button type="button" className="ge-solid-cta gx-perm__enable" onClick={enable}><Crosshair aria-hidden="true" strokeWidth={2} />Enable Location Services</button>
        <button type="button" className="gx-perm__later" onClick={() => navigate('/app/search')}>Maybe later, I'll search manually</button>
      </div>
    </main>
  );
}
