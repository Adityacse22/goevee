/**
 * Rich station card for the GoEvee Nearby list (demo screens). Matches the
 * mockup: thumbnail with kW badge, Hub Verified, distance/drive pills, an
 * availability progress bar, connector/price chips, 24×7, and the primary
 * "View Station Details" action beside a Directions icon button.
 */
import { Link } from 'react-router-dom';
import { Clock, Coffee, Navigation, Zap, ArrowRight, BadgeCheck } from 'lucide-react';
import { directionsUrl, freePercent, type DemoStation } from './demo-data';

export function StationCard({ station }: { station: DemoStation }) {
  const free = freePercent(station);
  const detailsHref = `/app/stations/${station.id}`;
  return (
    <article className="gx-card" aria-labelledby={`gx-${station.id}-title`}>
      <div className="gx-card__row">
        <div className="gx-card__thumb">
          <img src={station.imageUrl} alt="" width={120} height={96} loading="lazy" decoding="async" />
          <span className="gx-kw" aria-hidden="true">{station.peakKw} kW</span>
        </div>
        <div className="gx-card__head">
          <h3 className="gx-card__title" id={`gx-${station.id}-title`}>
            <Link to={detailsHref} className="gx-stretch">{station.name}</Link>
          </h3>
          {station.verified && (
            <span className="gx-verified"><BadgeCheck aria-hidden="true" strokeWidth={2} />Hub Verified</span>
          )}
          <p className="gx-card__addr">{station.shortAddress}</p>
          <div className="gx-pills" aria-hidden="true">
            <span className="gx-pill"><Navigation strokeWidth={1.75} />{station.distanceKm} km</span>
            <span className="gx-pill"><Clock strokeWidth={1.75} />{station.driveMin} min drive</span>
          </div>
        </div>
      </div>

      <div className="gx-avail">
        <div className="gx-avail__row">
          <span className="gx-avail__dot" data-free={station.baysFree > 0} aria-hidden="true" />
          <span className="gx-avail__text">{station.baysFree} of {station.baysTotal} bays available</span>
          <span className="gx-avail__pct">{free}% Free</span>
        </div>
        <div className="gx-bar" role="img" aria-label={`${station.baysFree} of ${station.baysTotal} bays available, ${free} percent free`}>
          <span className="gx-bar__fill" style={{ width: `${free}%` }} />
        </div>
      </div>

      <div className="gx-chips" aria-hidden="true">
        {station.connectors.slice(0, 2).map(connector => (
          <span key={connector.standard} className="gx-chip">{connector.standard}</span>
        ))}
        <span className="gx-chip">₹{station.tariffFrom}/kWh</span>
        <span className="gx-chip gx-chip--open">
          <Clock strokeWidth={1.75} />{station.open24x7 ? '24×7 Open' : 'Limited hours'}
        </span>
      </div>

      {station.amenitiesNearby && (
        <p className="gx-amenities"><Coffee aria-hidden="true" strokeWidth={1.75} />Amenities Near</p>
      )}

      <div className="gx-card__actions">
        <Link to={detailsHref} className="ge-solid-cta gx-card__cta">
          View Station Details
          <ArrowRight aria-hidden="true" strokeWidth={2} />
        </Link>
        <a
          className="gx-icon-btn"
          href={directionsUrl(station)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Directions to ${station.name} in Google Maps`}
        >
          <Navigation aria-hidden="true" strokeWidth={2} />
        </a>
      </div>
      <span className="gx-card__zap" aria-hidden="true"><Zap strokeWidth={2} fill="currentColor" /></span>
    </article>
  );
}
