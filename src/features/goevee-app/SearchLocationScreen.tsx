/**
 * GoEvee — Search Location (demo). Full-screen search with "Use current
 * location", a top result card, recent searches, and saved destinations.
 * Mockup-faithful.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Clock, Crosshair, Home, Mic, Search, SlidersHorizontal, X, Zap } from 'lucide-react';

const RECENTS = [
  { id: 'dlf-mall', name: 'DLF Mall of India', tag: 'Fast Hub', detail: 'Sector 18, Noida · 2.4 km' },
  { id: 'voltpoint', name: 'VoltPoint Expressway', tag: '120 kW', detail: 'Noida-Greater Noida Expy · 5.8 km' },
  { id: 'sector-62', name: 'Sector 62 Tech Park', tag: null, detail: 'Industrial Area, Noida · 7.1 km' },
];

const SAVED = [
  { id: 'home', icon: Home, label: 'Home (Apartment)', place: 'Sector 76, Skytech Matrott', meta: '3.1 kW AC', status: 'Available', chip: '2 Chargers' },
  { id: 'office', icon: Briefcase, label: 'Office Hub', place: 'Advant Navis Business Pa…', meta: '8.4 km away', status: '4 Slots free', chip: '60 kW DC' },
];

export default function SearchLocationScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('Sector 18');

  return (
    <main id="main-content" tabIndex={-1} className="gx-screen gx-screen--sheet outline-none">
      <div className="gx-body">
        <div className="gx-search-head">
          <span className="gx-search-head__label"><span className="gx-dotpulse" aria-hidden="true" />SEARCH LOCATION</span>
          <button type="button" className="gx-sheet__close" aria-label="Close search" onClick={() => navigate(-1)}><X aria-hidden="true" strokeWidth={1.75} /></button>
        </div>

        <div className="gx-search gx-search--lg" role="search">
          <Search aria-hidden="true" strokeWidth={1.75} />
          <label htmlFor="gx-loc-search" className="sr-only">Search a city, area, address or landmark</label>
          <input id="gx-loc-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a place" autoFocus />
          {query && <button type="button" aria-label="Clear" onClick={() => setQuery('')}><X aria-hidden="true" strokeWidth={1.75} /></button>}
          <span className="gx-search__div" aria-hidden="true" />
          <button type="button" className="gx-mic" aria-label="Voice search"><Mic aria-hidden="true" strokeWidth={1.75} /></button>
        </div>

        <button type="button" className="gx-use-loc" onClick={() => navigate('/app')}>
          <span className="gx-use-loc__icon" aria-hidden="true"><Crosshair strokeWidth={2} /></span>
          <span className="gx-use-loc__text">
            <b>Use Current Location <span className="gx-dot-green" aria-hidden="true" /></b>
            <small>Accurate via GPS · Sector 16 Film City</small>
          </span>
          <span className="gx-use-loc__cta" aria-hidden="true">Locate →</span>
        </button>

        <button type="button" className="gx-top-result" onClick={() => navigate('/app')}>
          <span className="gx-top-result__thumb" aria-hidden="true"><Zap strokeWidth={2} /><em>1.2km</em></span>
          <span className="gx-top-result__body">
            <span className="gx-top-result__row"><b>Sector 18 Commercial …</b><span className="gx-free-badge">6 Free</span></span>
            <small>DLF Mall &amp; Metro Station, Noida</small>
            <span className="gx-top-result__meta"><em className="gx-dot-green2">CCS2 60kW</em><em>₹14/kWh</em><em>4 min drive</em></span>
          </span>
        </button>

        <section className="gx-group" aria-labelledby="gx-recent-title">
          <div className="gx-group__head"><h2 id="gx-recent-title"><Clock aria-hidden="true" strokeWidth={1.75} />RECENT SEARCHES</h2><button type="button">Clear all</button></div>
          <ul className="gx-recent">
            {RECENTS.map(item => (
              <li key={item.id}>
                <button type="button" className="gx-recent__item" onClick={() => navigate('/app')}>
                  <Clock aria-hidden="true" strokeWidth={1.75} />
                  <span className="gx-recent__text"><b>{item.name}{item.tag && <em className="gx-recent__tag">{item.tag}</em>}</b><small>{item.detail}</small></span>
                  <span className="gx-recent__x" aria-hidden="true"><X strokeWidth={1.75} /></span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="gx-group" aria-labelledby="gx-saved-title">
          <div className="gx-group__head"><h2 id="gx-saved-title">★ SAVED DESTINATIONS</h2><button type="button">+ Add new</button></div>
          <div className="gx-saved-grid">
            {SAVED.map(({ id, icon: Icon, label, place, meta, status, chip }) => (
              <button key={id} type="button" className="gx-saved" onClick={() => navigate('/app')}>
                <span className="gx-saved__top"><span className="gx-saved__icon" aria-hidden="true"><Icon strokeWidth={1.75} /></span><em className="gx-saved__chip">{chip}</em></span>
                <b>{label}</b>
                <small>{place}</small>
                <span className="gx-saved__foot"><em>{meta}</em><em className="gx-saved__status">{status}</em></span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="gx-search-foot">
        <button type="button" className="ge-solid-cta gx-grow" onClick={() => navigate('/app')}><Search aria-hidden="true" strokeWidth={2} />Search in "{query || 'this area'}"</button>
        <button type="button" className="gx-icon-btn" aria-label="Filters"><SlidersHorizontal aria-hidden="true" strokeWidth={1.75} /></button>
      </div>
    </main>
  );
}
