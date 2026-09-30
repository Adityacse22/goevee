import { Link } from 'react-router-dom';
import PublicPage from '@/components/layout/PublicPage';

export default function NotFound() {
  return <PublicPage title="This stop isn’t on the map." eyebrow="404 · Page not found">
    <p>The address may have changed or the link may be incorrect. Let’s get you back to your electric journey.</p>
    <div className="flex flex-wrap gap-4">
      <Link to="/" className="action-primary no-underline">Back to home</Link>
      <Link to="/ev-charger-station" className="action-secondary no-underline">Find chargers</Link>
    </div>
  </PublicPage>;
}
