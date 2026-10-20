/**
 * GoEvee — Station details (demo). Hero, operator/rating, active-vehicle port
 * match, connector-gun selection, and a sticky "Choose a slot" footer that
 * carries the selected gun into the booking screen. Mockup-faithful.
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Car, CheckCircle2, Clock, MapPin, Navigation, Zap } from 'lucide-react';
import { ACTIVE_VEHICLE, directionsUrl, getDemoStation, STATION_GUNS } from './demo-data';

export default function StationDetailsScreen() {
  const { stationId = '' } = useParams();
  const navigate = useNavigate();
  const station = getDemoStation(stationId);
  const [gunId, setGunId] = useState(STATION_GUNS.find(gun => gun.recommended)?.id ?? STATION_GUNS[0].id);
  const gun = STATION_GUNS.find(item => item.id === gunId)!;

  if (!station) {
    return (
      <main id="main-content" tabIndex={-1} className="gx-screen outline-none">
        <div className="gx-soon"><h1>Station not found</h1><Link to="/app" className="ge-solid-cta">Back to Explore</Link></div>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="gx-screen gx-details outline-none">
      <header className="gx-det-head">
        <Link to="/app" className="gx-icon-btn gx-icon-btn--dash" aria-label="Back"><ArrowLeft aria-hidden="true" strokeWidth={1.75} /></Link>
        <div className="gx-det-head__title">
          <h1>Station details</h1>
          <p>DLF Mall of India · Sector 18</p>
        </div>
        <a className="gx-solid-ghost" href={directionsUrl(station)} target="_blank" rel="noopener noreferrer"><MapPin aria-hidden="true" strokeWidth={1.75} />Directions</a>
      </header>

      <div className="gx-body">
        {/* Hero */}
        <div className="gx-det-card">
          <div className="gx-det-hero">
            <span className="gx-det-hero__badges">
              <em className="gx-det-verified"><span className="gx-dot-green" aria-hidden="true" />Hub Verified</em>
              <em className="gx-det-rating">{station.rating} ★ ({station.reviews} reviews)</em>
            </span>
            <span className="gx-det-hero__guns" aria-hidden="true"><Zap strokeWidth={2} /><Zap strokeWidth={2} /></span>
            <span className="gx-det-hero__foot">
              <small>Operator: {station.operator}</small>
              <em className="gx-det-public">Public Station</em>
            </span>
          </div>
          <h2 className="gx-det-name">{station.name}</h2>
          <p className="gx-det-addr">{station.address}</p>
          <div className="gx-det-facts">
            <span><Clock aria-hidden="true" strokeWidth={1.75} /><b>{station.open24x7 ? '24×7 Facility' : 'Limited hours'}</b><small>Always accessible</small></span>
            <span><Navigation aria-hidden="true" strokeWidth={1.75} /><b>{station.distanceKm} km · {station.driveMin} min drive</b><small>Via Ring Road</small></span>
          </div>
        </div>

        {/* Active vehicle / port match */}
        <div className="gx-det-card gx-vehicle">
          <div className="gx-vehicle__row">
            <span className="gx-vehicle__icon" aria-hidden="true"><Car strokeWidth={1.75} /></span>
            <div className="min-w-0">
              <span className="gx-vehicle__label">ACTIVE VEHICLE <em className="gx-chip gx-chip--mini">{ACTIVE_VEHICLE.connector} Native</em></span>
              <b className="gx-vehicle__name">{ACTIVE_VEHICLE.name}</b>
              <small className="gx-vehicle__sub">Compatible with station {ACTIVE_VEHICLE.connector} guns</small>
            </div>
            <button type="button" className="gx-change" onClick={() => navigate('/app/vehicles')}>Change</button>
          </div>
          <p className="gx-portmatch">
            <CheckCircle2 aria-hidden="true" strokeWidth={2} />
            <span><b>Port match confirmed:</b> Both station {ACTIVE_VEHICLE.connector} guns fit your car port. Actual charging rate adjusts to vehicle BMS limit.</span>
          </p>
        </div>

        {/* Connector gun selection */}
        <div className="gx-det-sect">
          <div className="gx-det-sect__head">
            <div><h2>Select Connector Gun <em>(Sample fixtures)</em></h2><p>Tap to choose connector before slot scheduling</p></div>
            <span className="gx-updated">Updated 2m ago</span>
          </div>
          <ul className="gx-gun-list" role="radiogroup" aria-label="Connector gun">
            {STATION_GUNS.map(item => (
              <li key={item.id}>
                <button type="button" role="radio" aria-checked={item.id === gunId} className="gx-gun" data-on={item.id === gunId} onClick={() => setGunId(item.id)}>
                  <span className="gx-gun__radio" aria-hidden="true" />
                  <span className="gx-gun__main">
                    <span className="gx-gun__title">{item.label}</span>
                    {item.recommended && <em className="gx-gun__rec">RECOMMENDED</em>}
                    <span className="gx-gun__meta">Up to {item.maxKw} kW · ₹{item.tariffPerKwh}/kWh · {item.kind}</span>
                    <span className="gx-gun__status"><span className="gx-dot-green" aria-hidden="true" />{item.gunsFree} of {item.gunsTotal} guns available now <em>(Live status)</em></span>
                  </span>
                  <span className="gx-gun__price"><b>₹{item.tariffPerKwh}</b><small>per kWh</small></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="gx-det-foot">
        <div className="gx-det-foot__info">
          <span className="gx-det-foot__label"><span className="gx-dot-green" aria-hidden="true" />SELECTED CONNECTOR</span>
          <b>{gun.label.includes('CCS2') ? 'CCS2' : 'Type 2'} ({gun.maxKw} kW) <em>₹{gun.tariffPerKwh}/kWh</em></b>
          <small>No immediate payment charged</small>
        </div>
        <button type="button" className="ge-solid-cta" onClick={() => navigate(`/app/book/${station.id}?gun=${gun.id}`)}>Choose a slot <ArrowRight aria-hidden="true" strokeWidth={2} /></button>
      </div>
    </main>
  );
}
