import { Link } from 'react-router-dom';
import PublicPage from '@/components/layout/PublicPage';
import { POLICY_DATE, SUPPORT_EMAIL } from '@/config/site';

export default function Privacy() {
  return <PublicPage title="Privacy policy" eyebrow={`Last updated: ${POLICY_DATE}`}>
    <p>Evee (goevee.in) helps you discover EV charging stations and manage charging bookings. This notice explains how the website uses information and your choices. For privacy questions or requests, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    <h2>Information you provide</h2>
    <ul>
      <li><strong>Accounts:</strong> your name, email address, password and any phone number you add. Passwords are stored as hashes, rather than readable passwords.</li>
      <li><strong>Your charging journey:</strong> vehicle details, saved stations, booking times, selected chargers and booking status.</li>
      <li><strong>Support:</strong> information you include when you email us. Please do not send passwords or payment card details.</li>
    </ul>
    <h2>Location and maps</h2>
    <p>Search terms and selected locations are used to find charging stations. If you choose the location button and grant browser permission, your location is used to show nearby chargers. You can deny or revoke permission in browser settings and search by place instead.</p>
    <p>Maps and place search use Google Maps. When these features load, Google receives technical information such as your IP address; searches and coordinates are sent as needed to provide results. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google’s privacy policy</a>.</p>
    <h2>Why we use information</h2>
    <p>We use account and booking information to provide requested features, authenticate access, manage reservations and respond to support requests. Technical logs and security checks help operate the website, detect abuse and troubleshoot failures. Optional analytics, when configured and accepted by you, help us understand use of public pages.</p>
    <h2>Cookies and browser storage</h2>
    <p>Essential browser storage keeps you signed in and remembers preferences, including your cookie choice. Google Analytics is optional: it loads only after you select “Accept analytics.” You can reject it or withdraw your choice through “Cookie settings” in the footer. Read our <Link to="/cookies">cookies and storage notice</Link>.</p>
    <h2>Service providers and disclosures</h2>
    <p>Information is processed by the hosting and database services that run Evee and, where needed, by charging station operators to handle your reservation. Google provides maps and optional analytics. Cloudflare Turnstile may process technical signals to check whether a form submission is automated; see <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare’s privacy policy</a>. Providers may process data outside your country.</p>
    <p>We may disclose information where required by law or to investigate misuse and protect users. We do not sell personal information.</p>
    <h2>Retention and security</h2>
    <p>Account and booking records are retained while needed to provide the service, resolve disputes and meet applicable legal obligations. Retention differs by record type; contact us about a specific record or deletion request. We use HTTPS, password hashing and access controls, but no online service can guarantee absolute security.</p>
    <h2>Your choices and requests</h2>
    <p>You can update supported account details from your profile, revoke location permission in your browser and change optional analytics preferences at any time. To request access, correction or deletion of information, withdraw consent, or raise a privacy grievance, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We may need to verify account ownership. Some records may need to be retained where required by law or to resolve outstanding transactions.</p>
    <h2>Age and updates</h2>
    <p>Evee accounts are intended for people aged 18 or over. If you believe a child has provided personal information, contact us. We will update the date above when this notice changes and seek a new choice where a change requires consent.</p>
  </PublicPage>;
}
