/**
 * GoEvee — Nearby Charging (list). Mockup-faithful demo screen.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Map as MapIcon, Radio, Search, User, X } from 'lucide-react';
import { DEMO_LOCATION, DEMO_STATIONS, RADIUS_OPTIONS, type DemoRadius } from './demo-data';
import { StationCard } from './StationCard';

export default function NearbyScreen() {
  const [radius, setRadius] = useState<DemoRadius>(5);
  const [sortByDistance, setSortByDistance] = useState(true);
  const [query, setQuery] = useState(DEMO_LOCATION.label);

  const stations = [...DEMO_STATIONS]
    .filter(station => station.distanceKm <= radius)
    .sort((a, b) => (sortByDistance ? a.distanceKm - b.distanceKm : b.baysFree - a.baysFree));

  return (
    <main id="main-content" tabIndex={-1} className="gx-screen outline-none">
      <header className="gx-appbar">
        <Link to="/app" className="gx-brand" aria-label="GoEvee home">
          <span className="gx-brand__mark" aria-hidden="true"><Radio strokeWidth={2} /></span>
          <span className="gx-brand__text">
            <strong>GoEvee</strong>
            <small>Charge · Drive · Go Further</small>
          </span>
        </Link>
        <div className="gx-appbar__actions">
          <Link to="/updates" className="gx-icon-btn gx-icon-btn--sm" aria-label="Notifications" data-badge="true">
            <Bell aria-hidden="true" strokeWidth={1.75} />
          </Link>
          <Link to="/profile" className="gx-avatar" aria-label="Your profile">
            <User aria-hidden="true" strokeWidth={1.75} />
          </Link>
        </div>
      </header>

      <div className="gx-body">
        <div className="gx-title-row">
          <div className="min-w-0">
            <h1 className="gx-h1">Nearby Charging</h1>
            <p className="gx-sub">{DEMO_LOCATION.label} · {radius} km radius</p>
          </div>
          <Link to="/app/map" className="gx-solid-ghost">
            <MapIcon aria-hidden="true" strokeWidth={1.75} />Map View
          </Link>
        </div>

        <div className="gx-search" role="search">
          <Search aria-hidden="true" strokeWidth={1.75} />
          <label htmlFor="gx-nearby-search" className="sr-only">Search a city or place</label>
          <input
            id="gx-nearby-search"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search a city or place"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
              <X aria-hidden="true" strokeWidth={1.75} />
            </button>
          )}
        </div>

        <div className="gx-radius" role="group" aria-label="Search radius and sort">
          {RADIUS_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              className="gx-radius__chip"
              aria-pressed={radius === option}
              onClick={() => setRadius(option)}
            >
              {radius === option ? '✓ ' : ''}Within {option} km
            </button>
          ))}
          <button
            type="button"
            className="gx-radius__sort"
            aria-pressed={sortByDistance}
            onClick={() => setSortByDistance(value => !value)}
          >
            ↕ Distance
          </button>
        </div>

        <div className="gx-meta-row">
          <span className="gx-count">{stations.length} charging hubs found</span>
          <span className="gx-live"><Radio aria-hidden="true" strokeWidth={1.75} />Live Telemetry</span>
        </div>

        <ul className="gx-list">
          {stations.map(station => (
            <li key={station.id}><StationCard station={station} /></li>
          ))}
        </ul>
      </div>
    </main>
  );
}
