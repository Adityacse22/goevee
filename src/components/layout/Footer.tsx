import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '@/config/site';
import { openCookieSettings } from '@/services/consent';

export default function Footer() {
  return <footer className="border-t border-white/15 bg-zinc-950 px-5 py-12 text-slate-300">
    <div className="container grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-1">
        <Link to="/" className="gradient-text text-3xl font-bold">Evee</Link>
        <p className="mt-4 max-w-sm text-sm leading-6">Find your next charging stop. Keep your electric journey moving.</p>
      </div>
      <nav aria-label="Explore"><h2 className="mb-4 font-semibold text-white">Explore</h2><ul className="space-y-3">
        <li><Link to="/ev-charger-station">Find chargers</Link></li>
        <li><Link to="/bookings">My bookings</Link></li>
        <li><Link to="/about">About Evee</Link></li>
      </ul></nav>
      <nav aria-label="Support"><h2 className="mb-4 font-semibold text-white">Support</h2><ul className="space-y-3">
        <li><Link to="/help">Help & contact</Link></li>
        <li><a className="break-all" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
      </ul></nav>
      <nav aria-label="Legal"><h2 className="mb-4 font-semibold text-white">Legal & privacy</h2><ul className="space-y-3">
        <li><Link to="/privacy">Privacy policy</Link></li>
        <li><Link to="/terms">Terms & conditions</Link></li>
        <li><Link to="/cookies">Cookies & storage</Link></li>
        <li><button type="button" className="underline underline-offset-4" onClick={openCookieSettings}>Cookie settings</button></li>
      </ul></nav>
    </div>
    <div className="container mt-10 border-t border-white/15 pt-6 text-sm">© {new Date().getFullYear()} Evee. All rights reserved.</div>
  </footer>;
}
