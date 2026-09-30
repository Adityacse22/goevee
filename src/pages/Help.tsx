import { Link } from 'react-router-dom';
import PublicPage from '@/components/layout/PublicPage';
import { SUPPORT_EMAIL } from '@/config/site';

export default function Help() {
  return <PublicPage title="How can we help?" eyebrow="Evee support">
    <p>Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for help with your account, station information or a booking. Include the page or booking reference and a description of the issue. Never send your password or payment details.</p>
    <h2>Find a charger</h2><p>Open <Link to="/ev-charger-station">Find chargers</Link>, enter a city or place, or allow location access to find nearby options. Check connector compatibility before travelling.</p>
    <h2>Manage a booking</h2><p>Sign in and open <Link to="/bookings">My bookings</Link> to review reservations and available cancellation controls. Contact the station operator about equipment, access or charging prices.</p>
    <h2>Account access</h2><p>If you cannot sign in, check the email you used when registering. Self-service password reset is not available yet; contact support for help verifying account ownership.</p>
    <h2>Privacy and accessibility</h2><p>For data access, correction, deletion, privacy concerns or an accessibility issue, contact the email above. Read our <Link to="/privacy">privacy policy</Link> or change cookie settings in the footer.</p>
  </PublicPage>;
}
