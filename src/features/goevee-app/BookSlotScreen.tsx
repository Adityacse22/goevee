/**
 * GoEvee — Book Charging Slot (demo). Station header, bay hero, vehicle + gun
 * summary, date strip, an arrival-slot grid with distinct states, and a sticky
 * deposit + "Slot Guaranteed!" footer. Mockup-faithful. Demo data only — no
 * real reservation is created.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, CalendarDays, Car, CheckCircle2, HelpCircle, Lock, MapPin, User, Zap } from 'lucide-react';
import { ACTIVE_VEHICLE, BOOKING_DATES, BOOKING_SLOTS, getDemoStation, STATION_GUNS, type DemoSlot } from './demo-data';

const STATE_LABEL: Record<DemoSlot['state'], string> = {
  available: 'Available', selected: 'Selected', booked: 'Booked', fillingFast: 'Filling Fast', peak: 'Available',
};

export default function BookSlotScreen() {
  const { stationId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const station = getDemoStation(stationId);
  const gun = STATION_GUNS.find(item => item.id === params.get('gun')) ?? STATION_GUNS[0];
  const [dateId, setDateId] = useState<string>(BOOKING_DATES[2].id);
  const [slotId, setSlotId] = useState(BOOKING_SLOTS.find(slot => slot.state === 'selected')?.id ?? '');
  const selectedSlot = useMemo(() => BOOKING_SLOTS.find(slot => slot.id === slotId), [slotId]);

  if (!station) {
    return <main className="gx-screen"><div className="gx-soon"><h1>Station not found</h1><Link to="/app" className="ge-solid-cta">Back to Explore</Link></div></main>;
  }

  return (
    <main id="main-content" tabIndex={-1} className="gx-screen gx-book outline-none">
      <header className="gx-book-head">
        <Link to={`/app/stations/${station.id}`} className="gx-icon-btn gx-icon-btn--dash" aria-label="Back"><ArrowLeft aria-hidden="true" strokeWidth={1.75} /></Link>
        <h1>Book Charging Slot</h1>
        <div className="gx-book-head__actions">
          <button type="button" className="gx-icon-btn gx-icon-btn--sm" aria-label="Help"><HelpCircle aria-hidden="true" strokeWidth={1.75} /></button>
          <Link to="/app/profile" className="gx-avatar" aria-label="Profile"><User aria-hidden="true" strokeWidth={1.75} /></Link>
        </div>
      </header>

      <div className="gx-body">
        {/* Station + vehicle summary */}
        <div className="gx-det-card">
          <div className="gx-book-station">
            <span className="gx-book-station__icon" aria-hidden="true"><Zap strokeWidth={2} /></span>
            <div className="min-w-0">
              <b className="gx-book-station__name">{station.name.slice(0, 16)}… <BadgeCheck aria-hidden="true" strokeWidth={2} className="gx-inline-verified" /></b>
              <small>DLF Mall of India, Sec 18, No…</small>
            </div>
            <em className="gx-live gx-live--pill"><span className="gx-dot-green" aria-hidden="true" />Live Sync</em>
          </div>
          <div className="gx-book-bay" role="img" aria-label="Charging bay P2-B, Basement Level 2">
            <img src={station.imageUrl} alt="" width={480} height={160} />
            <span className="gx-book-bay__label"><MapPin aria-hidden="true" strokeWidth={1.75} />Bay P2-B · Basement Level 2</span>
          </div>
          <div className="gx-book-vehicle">
            <Car aria-hidden="true" strokeWidth={1.75} />
            <span className="gx-book-vehicle__text"><b>{ACTIVE_VEHICLE.name}</b><small>{ACTIVE_VEHICLE.pack} · {ACTIVE_VEHICLE.socPercent}% Current State</small></span>
            <button type="button" className="gx-change gx-change--dash" onClick={() => navigate('/app/vehicles')}>Change</button>
          </div>
          <div className="gx-book-gun">
            <span className="gx-book-gun__icon" aria-hidden="true"><Zap strokeWidth={2} /></span>
            <span className="gx-book-gun__text"><b>{gun.label.includes('CCS2') ? 'CCS2 Gun A' : 'Type 2 Gun B'} <em className="gx-chip gx-chip--mini">{gun.maxKw} kW DC</em></b><small>₹{gun.tariffPerKwh}.00 / kWh tariff rate</small></span>
            <button type="button" className="gx-change gx-change--dash" onClick={() => navigate(`/app/stations/${station.id}`)}>Change Gun</button>
          </div>
        </div>

        {/* Date strip */}
        <div className="gx-book-sect__head"><h2><CalendarDays aria-hidden="true" strokeWidth={1.75} />Select Date</h2><span>IST (UTC+5:30)</span></div>
        <div className="gx-date-strip" role="radiogroup" aria-label="Select date">
          {BOOKING_DATES.map(date => (
            <button key={date.id} type="button" role="radio" aria-checked={date.id === dateId} className="gx-date" data-on={date.id === dateId} onClick={() => setDateId(date.id)}>
              <small>{date.dow}</small><b>{date.day}</b>
            </button>
          ))}
        </div>

        {/* Arrival slots */}
        <div className="gx-book-sect__head gx-book-sect__head--slots">
          <div><h2>Arrival Slot</h2><p>Guaranteed stall hold upon arrival</p></div>
          <em className="gx-slot-badge"><span aria-hidden="true">⏱</span> 30m blocks</em>
        </div>
        <ul className="gx-slot-grid" role="radiogroup" aria-label="Arrival slot">
          {BOOKING_SLOTS.map(slot => {
            const disabled = slot.state === 'booked';
            const on = slot.id === slotId;
            return (
              <li key={slot.id}>
                <button type="button" role="radio" aria-checked={on} aria-disabled={disabled} disabled={disabled}
                  className="gx-slot" data-state={on ? 'selected' : slot.state}
                  onClick={() => { if (!disabled) setSlotId(slot.id); }}>
                  <b className="gx-slot__time">{slot.start} - {slot.end}</b>
                  {slot.state === 'booked'
                    ? <span className="gx-slot__meta"><span className="gx-slot__dot" />{slot.note} <Lock aria-hidden="true" strokeWidth={2} /></span>
                    : on
                      ? <em className="gx-slot__selected">Selected</em>
                      : <span className="gx-slot__meta"><span className="gx-slot__dot" data-state={slot.state} />{STATE_LABEL[slot.state]}{slot.note ? ` · ${slot.note}` : ''}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sticky footer */}
      <div className="gx-book-foot">
        <div className="gx-book-foot__info"><b>₹50 <em>Deposit</em></b><small>Adjusted against final k…</small></div>
        <button type="button" className="ge-solid-cta" disabled={!selectedSlot} onClick={() => navigate('/app/bookings')}>
          <CheckCircle2 aria-hidden="true" strokeWidth={2} />Slot Guaranteed!
        </button>
      </div>
    </main>
  );
}
