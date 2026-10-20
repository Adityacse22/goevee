/** Placeholder for GoEvee app tabs not yet built (keeps nav off the legacy UI). */
import { Link } from 'react-router-dom';
import { Compass, Hammer } from 'lucide-react';

export default function ComingSoon({ title }: { title: string }) {
  return (
    <main id="main-content" tabIndex={-1} className="gx-screen outline-none">
      <div className="gx-soon">
        <span className="gx-soon__icon" aria-hidden="true"><Hammer strokeWidth={1.75} /></span>
        <h1>{title}</h1>
        <p>This GoEvee screen is being built in the next batch. It isn't wired to the old interface.</p>
        <Link to="/app" className="ge-solid-cta"><Compass aria-hidden="true" strokeWidth={2} />Back to Explore</Link>
      </div>
    </main>
  );
}
