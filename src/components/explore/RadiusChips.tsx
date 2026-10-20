/**
 * Search radius: a native radio group styled as chips, so arrow keys, Space
 * and screen-reader semantics come from the platform. Changing the radius
 * re-runs the search at exactly that radius (never silently widened).
 */
import { useExplore } from '@/controllers/useExplore';
import { t } from '@/lib/messages';
import { RADIUS_OPTIONS_KM } from '../../../shared/discovery';

export function RadiusChips() {
  const { radiusKm, setRadiusKm } = useExplore();
  return (
    <fieldset className="ge-radius">
      <legend className="ge-radius__legend">{t.discovery.radiusGroup}</legend>
      <div className="ge-radius__options">
        {RADIUS_OPTIONS_KM.map(option => (
          <label key={option} className="ge-chip ge-radius__chip" data-checked={option === radiusKm}>
            <input
              type="radio"
              name="search-radius"
              className="ge-sr-only"
              value={option}
              checked={option === radiusKm}
              onChange={() => setRadiusKm(option)}
            />
            <span className="ge-tnum">{t.discovery.radiusOption(option)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
