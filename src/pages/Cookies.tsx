import { Link } from 'react-router-dom';
import PublicPage from '@/components/layout/PublicPage';
import { openCookieSettings } from '@/services/consent';

export default function Cookies() {
  return <PublicPage title="Cookies & browser storage" eyebrow="Your preferences, your choice">
    <p>Evee uses essential browser storage to operate the site. Optional analytics remains off until you accept it. Charger search and your account work without accepting analytics.</p>
    <h2>Essential storage</h2>
    <ul>
      <li><strong>evee.jwt:</strong> a sign-in token in local storage, removed when you sign out. It expires according to the server’s session configuration.</li>
      <li><strong>evee.consent.v1:</strong> your analytics choice and its date. We ask again after 180 days.</li>
      <li><strong>theme:</strong> your display preference, where selected, until you clear it.</li>
    </ul>
    <h2>Optional analytics</h2>
    <p>When configured, Google Analytics loads only after acceptance. It uses cookies such as <code>_ga</code> and <code>_ga_…</code> to measure visits. We set an expiry of up to 180 days and disable advertising signals. We send public page paths and charger-discovery button events, not account details, search text, booking IDs or precise location.</p>
    <p>Withdrawing your choice stops analytics loading, removes accessible analytics cookies and reloads the page to stop the loaded script. This does not erase information already received by Google. Browser controls can also block or delete cookies.</p>
    <h2>Maps and abuse prevention</h2>
    <p>Google Maps loads when you use map or place-search features. Cloudflare Turnstile protects account forms when configured. These services receive technical information needed for their features and are separate from optional analytics. See the <Link to="/privacy">privacy policy</Link> for provider details.</p>
    <button type="button" className="action-primary" onClick={openCookieSettings}>Change cookie settings</button>
  </PublicPage>;
}
