import { Link } from 'react-router-dom';
import PublicPage from '@/components/layout/PublicPage';

export default function About() {
  return <PublicPage title="A simpler electric journey." eyebrow="About Evee">
    <p>Evee brings EV charging station discovery and booking tools into one place for drivers in India. Search by location, explore stations on a map and keep your charging plans together.</p>
    <h2>Plan with better information</h2><p>Use station details to compare connector options and decide where to stop. Station data and availability can change, so check access, compatibility and current prices with the operator before travelling.</p>
    <h2>Built around your next stop</h2><p>Start with a location. Create an account to use saved stations and bookings. For feedback or help, visit <Link to="/help">Help & contact</Link>.</p>
    <Link className="action-primary no-underline" to="/ev-charger-station">Find chargers</Link>
  </PublicPage>;
}
