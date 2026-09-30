import { ArrowRight, MapPin, PlugZap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackFindChargers } from '@/services/analytics';

export default function HeroSection() {
  return <section aria-labelledby="hero-title" className="relative isolate flex min-h-[min(820px,100svh)] flex-col items-center justify-center overflow-hidden px-5 pb-12 pt-28 text-center sm:pt-36">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_50%,rgba(30,174,219,0.13),transparent_65%)]" />
    <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/5 px-4 py-2 text-sm text-cyan-200"><PlugZap className="h-4 w-4" aria-hidden="true" /> Your next charge starts here</p>
    <h1 id="hero-title" className="max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">Find your next<br /><span className="gradient-text">charging stop.</span></h1>
    <p className="mb-8 mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Discover EV charging stations near you. Explore the options and plan a smoother electric journey.</p>
    <Link to="/ev-charger-station" onClick={trackFindChargers} className="action-primary gap-3 text-base">Find chargers <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
    <p className="mt-4 flex items-center gap-2 text-sm text-slate-300"><MapPin className="h-4 w-4" aria-hidden="true" /> Search by city, place or your location</p>
    <img src="/images/tata_harrier_ev_transparent.webp" srcSet="/images/tata_harrier_ev_small.webp 416w, /images/tata_harrier_ev_transparent.webp 640w" sizes="(min-width: 640px) 256px, 208px" alt="Tata Harrier electric SUV" width="640" height="640" className="mt-8 h-auto w-52 max-w-full sm:w-64" decoding="async" fetchPriority="high" />
  </section>;
}
