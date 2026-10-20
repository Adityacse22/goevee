/**
 * GoEvee — Notifications / Updates (demo). Tabbed list (All / Charging /
 * Bookings / Alerts & Wallet) grouped by Today / Yesterday, plus a smart-tip
 * card. Mockup-faithful. Demo data only.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BatteryCharging, Car, Fuel, Zap } from 'lucide-react';

type Tab = 'All' | 'Charging' | 'Bookings' | 'Alerts & Wallet';
const TABS: { id: Tab; count?: number }[] = [{ id: 'All' }, { id: 'Charging', count: 3 }, { id: 'Bookings' }, { id: 'Alerts & Wallet' }];

interface Note {
  id: string; group: 'Charging' | 'Bookings' | 'Alerts & Wallet'; icon: typeof Zap; tone: 'green' | 'muted';
  title: string; time: string; body: React.ReactNode; chips?: string[];
  action?: { label: string; variant: 'solid' | 'ghost' }; day: 'TODAY' | 'YESTERDAY'; unread?: boolean;
}

const NOTES: Note[] = [
  {
    id: 'n1', group: 'Charging', icon: Zap, tone: 'green', day: 'TODAY', unread: true,
    title: '80% Battery Limit Reached', time: '12m ago',
    body: <>Tata Nexon EV at <strong>Jio-bp Pulse, Bandra West</strong> reached target charge. Idle fees start in 15 mins.</>,
    chips: ['CCS2 · 48 kW DC'], action: { label: 'Track Live', variant: 'ghost' },
  },
  {
    id: 'n2', group: 'Charging', icon: Fuel, tone: 'muted', day: 'YESTERDAY',
    title: 'Hub Connector Back…', time: 'Yesterday, 5:14 PM',
    body: <>60kW DC Gun-2 at <strong>Phoenix Marketcity Mall</strong> has finished scheduled maintenance and is now accepting cars.</>,
    chips: ['Available Now'], action: { label: 'Reserve Bay', variant: 'ghost' },
  },
];

export default function UpdatesScreen() {
  const [tab, setTab] = useState<Tab>('Charging');
  const notes = NOTES.filter(note => tab === 'All' || note.group === tab);
  const today = notes.filter(note => note.day === 'TODAY');
  const yesterday = notes.filter(note => note.day === 'YESTERDAY');

  return (
    <main id="main-content" tabIndex={-1} className="gx-screen outline-none">
      <header className="gx-up-head">
        <Link to="/app" className="gx-icon-btn gx-icon-btn--dash" aria-label="Back"><ArrowLeft aria-hidden="true" strokeWidth={1.75} /></Link>
        <div className="gx-up-title">
          <h1>Notifications</h1>
          <p><span className="gx-dot-green" aria-hidden="true" />3 new updates</p>
        </div>
        <button type="button" className="gx-up-read">Mark read</button>
      </header>

      <div className="gx-body">
        <div className="gx-up-tabs" role="tablist" aria-label="Notification categories">
          {TABS.map(({ id, count }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className="gx-up-tab" onClick={() => setTab(id)}>
              {id}{count != null && <span className="gx-up-tab__count">{count}</span>}
            </button>
          ))}
        </div>

        {([['TODAY', today], ['YESTERDAY', yesterday]] as const).map(([label, list]) => list.length > 0 && (
          <section key={label} className="gx-up-group" aria-label={label}>
            <div className="gx-up-group__head"><span>{label}</span><em>{list.length} event{list.length === 1 ? '' : 's'}</em></div>
            <ul className="gx-up-list">
              {list.map(note => {
                const Icon = note.icon;
                return (
                  <li key={note.id} className="gx-note">
                    <span className="gx-note__icon" data-tone={note.tone} aria-hidden="true"><Icon strokeWidth={1.75} /></span>
                    <div className="gx-note__body">
                      <div className="gx-note__top">
                        <h2>{note.unread && <span className="gx-note__dot" aria-hidden="true" />}{note.title}</h2>
                        <time>{note.time}</time>
                      </div>
                      <p>{note.body}</p>
                      <div className="gx-note__foot">
                        {note.chips?.map(chip => <span key={chip} className="gx-note__chip">{chip}</span>)}
                        {note.action && (
                          <button type="button" className={note.action.variant === 'ghost' ? 'gx-note__btn gx-note__btn--ghost' : 'gx-note__btn'}>
                            {note.action.label}{note.action.variant === 'solid' && <ArrowRight aria-hidden="true" strokeWidth={2} />}
                            {note.action.variant === 'ghost' && note.action.label === 'Track Live' && <ArrowRight aria-hidden="true" strokeWidth={2} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <div className="gx-tip">
          <span className="gx-tip__icon" aria-hidden="true"><Car strokeWidth={1.75} /></span>
          <div><b>Smart Charging Alert Tip</b><p>Push notifications alert you 10 minutes before peak tariff changes in your circle.</p></div>
        </div>

        {notes.length === 0 && (
          <div className="gx-up-empty"><BatteryCharging aria-hidden="true" strokeWidth={1.5} /><p>No {tab.toLowerCase()} updates right now.</p></div>
        )}
      </div>
    </main>
  );
}
