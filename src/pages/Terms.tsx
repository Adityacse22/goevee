import { Link } from 'react-router-dom';
import PublicPage from '@/components/layout/PublicPage';
import { POLICY_DATE, SUPPORT_EMAIL } from '@/config/site';

export default function Terms() {
  return <PublicPage title="Terms & conditions" eyebrow={`Last updated: ${POLICY_DATE}`}>
    <p>These terms apply to Evee at goevee.in. By using the service or creating an account, you agree to these terms. If you do not agree, please stop using the service. Questions can be sent to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    <h2>What Evee provides</h2>
    <p>Evee helps you discover EV charging stations, review station information and use available account and booking features. A listing does not mean Evee owns or operates that station. Charging is provided by the relevant station operator.</p>
    <h2>Your account</h2>
    <p>You must be at least 18 to create an account. Provide accurate information, keep your sign-in details secure and tell us if you suspect unauthorized access. You are responsible for activity you authorize through your account.</p>
    <h2>Station information and safe use</h2>
    <p>Locations, connector types, availability, opening hours and prices may change or be supplied by third parties. Check compatibility, access, current pricing and operating conditions with the operator before travelling or charging. Map results and estimates do not guarantee availability. Follow the operator’s safety instructions and do not use Evee while driving.</p>
    <h2>Bookings, prices and cancellations</h2>
    <p>A booking is confirmed only when the service displays a successful confirmation. Review the station, charger and time before submitting. An estimated price is not a final charge; check the operator’s price and any cancellation or refund terms before agreeing to pay. Evee does not currently collect payment card details through this website.</p>
    <p>Use the booking controls to cancel where available. If a booking cannot be completed, a charger is unavailable or a cancellation is unclear, contact us and the relevant operator. Nothing here limits refund or other rights under consumer law.</p>
    <h2>Acceptable use</h2>
    <p>Do not submit fraudulent bookings, impersonate others, access another person’s account, bypass security controls, send spam or use automation that disrupts the service. Do not reuse content in ways that violate the rights of Evee, station operators or map providers.</p>
    <h2>Third-party services and privacy</h2>
    <p>Map providers and charging operators have their own terms and policies. Google Maps features are also subject to <a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noopener noreferrer">Google Maps’ terms</a>. Our <Link to="/privacy">privacy policy</Link> explains how Evee handles personal information.</p>
    <h2>Availability and responsibility</h2>
    <p>We work to keep Evee useful and available, but interruptions, errors and outdated information can occur. To the extent permitted by applicable law, we do not guarantee uninterrupted service or third-party charging equipment performance. Nothing here excludes rights or liabilities that cannot lawfully be excluded.</p>
    <h2>Suspension, changes and concerns</h2>
    <p>We may restrict accounts that misuse the service or create security risks. Features and these terms may change; the date above identifies this version. Contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> to raise a concern, request account closure or ask about a change. Applicable consumer and data protection rights remain available to you.</p>
  </PublicPage>;
}
