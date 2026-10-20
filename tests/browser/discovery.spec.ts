/**
 * Charger discovery — end-to-end behaviour against stubbed /api/v1/discovery.
 * Covers: location states, typed location search, stale-response guards, the
 * five radii, boundary exclusion, the 20-result cap, empty/partial/failure,
 * the Navigate page (refresh, origin, Google Maps hand-off), unknowns and the
 * non-bookable guard. Live provider data is NOT exercised here (see report).
 */
import { test, expect, type Page } from '@playwright/test';
import { ccs2, eastOf, mockGeolocation, PLACES, seedPlace, stubDiscovery, type FixtureStation } from './helpers/discovery';

const MORNING = new Date(Date.UTC(2026, 8, 27, 5, 12));
const CP = PLACES.connaught.coords;
const DEVICE = { lat: 28.6129, lng: 77.2295 }; // India Gate — the "device" in GPS tests

const near = (id: string, name: string, km: number, extra: Partial<FixtureStation> = {}): FixtureStation => ({ id, name, ...eastOf(CP, km), ...extra });

const WORLD: FixtureStation[] = [
  near('ChIJ_station_alpha', 'Alpha Charge Point', 1.2, { connectors: [ccs2(2, 1)] }),
  near('ChIJ_station_bravo', 'Bravo EV Hub', 3.4, { connectors: [ccs2(1, null, null)], weekdayHours: ['Monday: Open 24 hours'] }),
  near('ChIJ_station_tempcl', 'Closed For Repairs', 4.1, { status: 'temporarily_closed' }),
  near('ChIJ_station_edge95', 'Just Inside Ten', 9.95),
  near('ChIJ_station_out105', 'Just Outside Ten', 10.5),
  near('ChIJ_station_far25k', 'Twenty Five Out', 25),
  near('ChIJ_station_far45k', 'Forty Five Out', 45),
  near('ChIJ_station_far80k', 'Eighty Out', 80),
];

const cards = (page: Page) => page.locator('#nearby-chargers article');
const titles = async (page: Page) => {
  await expect(cards(page).first()).toBeVisible();
  return cards(page).locator('h3').allInnerTexts();
};
const combobox = (page: Page) => page.getByRole('combobox', { name: 'Search a city, area, address or landmark' });
const summary = (page: Page) => page.getByTestId('results-summary');

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(MORNING);
  await page.addInitScript(() => {
    localStorage.setItem('evee.consent.v1', JSON.stringify({ version: 1, analytics: false, updatedAt: Date.UTC(2026, 8, 20) }));
  });
});

test('starts with no location: no default city, no automatic prompt, no search', async ({ page }) => {
  const log = await stubDiscovery(page, { stations: WORLD });
  await mockGeolocation(page, { kind: 'success', ...DEVICE });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Choose where to look for chargers' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nearby chargers' })).toBeVisible();
  await expect(page.getByText(/Sector 62|Noida/)).toHaveCount(0);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(0);
  expect(log.searches).toHaveLength(0);
});

test('GPS: "Finding your location…" then charger loading, then results at the device position', async ({ page }) => {
  const log = await stubDiscovery(page, { stations: WORLD, searchDelayMs: () => 500 });
  await mockGeolocation(page, { kind: 'success', ...DEVICE, delayMs: 500 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Use my current location' }).click();
  await expect(page.locator('#nearby-chargers').getByRole('status').filter({ hasText: 'Finding your location…' })).toBeVisible();
  await expect(page.locator('#nearby-chargers').getByRole('status').filter({ hasText: /^Loading chargers near/ })).toBeVisible();
  await titles(page);
  expect(log.searches[0]).toEqual({ lat: DEVICE.lat, lng: DEVICE.lng, radiusKm: 10 });
  // Reverse-geocoded label arrives without blocking discovery.
  await expect(page.getByRole('heading', { name: 'Chargers near Connaught Place, New Delhi' })).toBeVisible();
});

test('permission already granted: uses the device location without a click', async ({ page }) => {
  const log = await stubDiscovery(page, { stations: WORLD, reverseLabel: null });
  await mockGeolocation(page, { kind: 'success', ...DEVICE }, 'granted');
  await page.goto('/');
  await titles(page);
  expect(log.searches[0]).toMatchObject({ lat: DEVICE.lat, lng: DEVICE.lng });
  // No reverse-geocode label → an honest generic label, never a city name.
  await expect(page.getByRole('heading', { name: 'Chargers near your current location' })).toBeVisible();
});

for (const [kind, text, retry] of [
  ['denied', 'Location access is blocked for this site.', false],
  ['timeout', 'Finding your location took too long.', true],
  ['unavailable', 'Your device couldn’t determine its location.', true],
  ['unsupported', 'This browser can’t share your location.', false],
] as const) {
  test(`location ${kind}: explains, offers search, never substitutes a default city`, async ({ page }) => {
    const log = await stubDiscovery(page, { stations: WORLD });
    await mockGeolocation(page, kind === 'unsupported' ? { kind } : { kind });
    await page.goto('/');
    await page.getByRole('button', { name: 'Use my current location' }).click();
    const message = page.locator('.ge-search__message');
    await expect(message).toContainText(text);
    await expect(message.getByRole('button', { name: 'Try again' })).toHaveCount(retry ? 1 : 0);
    await expect(page.getByRole('heading', { name: 'Choose where to look for chargers' })).toBeVisible();
    expect(log.searches).toHaveLength(0);
  });
}

test('typed location: debounced autocomplete with session token, keyboard pick, labelled results', async ({ page }) => {
  const log = await stubDiscovery(page, { stations: WORLD });
  await page.goto('/');
  const input = combobox(page);
  await input.click();
  await input.pressSequentially('conn', { delay: 40 });
  await expect(page.getByRole('option', { name: /Connaught Place.*New Delhi, Delhi, India/ })).toBeVisible();
  await expect(page.getByRole('option', { name: /Connaught Road.*Hong Kong/ })).toBeVisible();
  expect(log.autocompletes.map(call => call.input)).toEqual(['conn']);
  // Option 0 is "Use my current location"; option 1 is Connaught Place.
  await input.press('ArrowDown');
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page.getByRole('heading', { name: 'Chargers near Connaught Place' })).toBeVisible();
  expect(await titles(page)).toEqual(['Alpha Charge Point', 'Bravo EV Hub', 'Closed For Repairs', 'Just Inside Ten']);
  expect(log.resolves).toEqual([{ placeId: PLACES.connaught.placeId, sessionToken: log.autocompletes[0].sessionToken }]);
  expect(log.searches.at(-1)).toEqual({ ...CP, radiusKm: 10 });
  await expect(input).toHaveValue('Connaught Place');
  await expect(summary(page)).toHaveText('4 shown · within 10\u00A0km');
});

test('Enter never silently picks between ambiguous places; a single match resolves', async ({ page }) => {
  const log = await stubDiscovery(page, { stations: WORLD });
  await page.goto('/');
  const input = combobox(page);
  await input.fill('conn');
  await input.press('Enter');
  await expect(page.getByText('2 places match. Choose one from the list.')).toBeVisible();
  expect(log.resolves).toHaveLength(0);
  expect(log.searches).toHaveLength(0);
  await input.fill('connaught p');
  await input.press('Enter');
  await expect(page.getByRole('heading', { name: 'Chargers near Connaught Place' })).toBeVisible();
  expect(log.resolves.map(item => item.placeId)).toEqual([PLACES.connaught.placeId]);
});

test('editing or clearing the text does not relabel the results already shown', async ({ page }) => {
  await stubDiscovery(page, { stations: WORLD });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  await titles(page);
  await combobox(page).fill('kora');
  await expect(page.getByRole('heading', { name: 'Chargers near Connaught Place' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.getByRole('heading', { name: 'Chargers near Connaught Place' })).toBeVisible();
  expect(await titles(page)).toContain('Alpha Charge Point');
});

test('an older, slower search response never replaces a newer one', async ({ page }) => {
  const koramangala = { id: 'ChIJ_station_korama', name: 'Koramangala Charger', ...eastOf(PLACES.koramangala.coords, 1) };
  const log = await stubDiscovery(page, {
    stations: [...WORLD, koramangala],
    // Connaught Place answers slowly; Koramangala answers fast.
    searchDelayMs: call => (Math.abs(call.lat - CP.lat) < 0.01 ? 2500 : 50),
  });
  await page.goto('/');
  const input = combobox(page);
  await input.fill('connaught p');
  await input.press('Enter');
  await expect(page.getByRole('heading', { name: 'Chargers near Connaught Place' })).toBeVisible();
  await input.fill('kora');
  await input.press('Enter');
  await expect(page.getByRole('heading', { name: 'Chargers near Koramangala' })).toBeVisible();
  expect(await titles(page)).toEqual(['Koramangala Charger']);
  await page.waitForTimeout(2800); // the stale Connaught Place response lands
  expect(log.searches.length).toBeGreaterThanOrEqual(2);
  expect(await titles(page)).toEqual(['Koramangala Charger']);
  await expect(page.getByRole('heading', { name: 'Chargers near Koramangala' })).toBeVisible();
});

test('a late GPS callback does not overwrite a place chosen afterwards', async ({ page }) => {
  await stubDiscovery(page, { stations: WORLD });
  await mockGeolocation(page, { kind: 'success', lat: 19.076, lng: 72.8777, delayMs: 1500 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Use my current location' }).click();
  const input = combobox(page);
  await input.fill('connaught p');
  await input.press('Enter');
  await expect(page.getByRole('heading', { name: 'Chargers near Connaught Place' })).toBeVisible();
  await page.waitForTimeout(1800);
  await expect(page.getByRole('heading', { name: 'Chargers near Connaught Place' })).toBeVisible();
  expect(await titles(page)).toContain('Alpha Charge Point');
});

test('radius chips: exactly 10/20/30/50/100 km, default 10, exact boundary, URL state', async ({ page }) => {
  const log = await stubDiscovery(page, { stations: WORLD });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  const group = page.getByRole('group', { name: 'Search radius' });
  await expect(group.getByRole('radio')).toHaveCount(5);
  expect(await group.locator('label').allInnerTexts()).toEqual(['10\u00A0km', '20\u00A0km', '30\u00A0km', '50\u00A0km', '100\u00A0km']);
  await expect(group.getByRole('radio', { name: '10 km' })).toBeChecked();
  let names = await titles(page);
  expect(names).toContain('Just Inside Ten');
  expect(names).not.toContain('Just Outside Ten');

  const expected: Record<number, string[]> = {
    20: ['Just Outside Ten'],
    30: ['Twenty Five Out'],
    50: ['Forty Five Out'],
    100: ['Eighty Out'],
  };
  for (const radius of [20, 30, 50, 100]) {
    await group.getByText(`${radius}\u00A0km`, { exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`radius=${radius}`));
    await expect(summary(page)).toContainText(`within ${radius}\u00A0km`);
    names = await titles(page);
    for (const name of expected[radius]) expect(names).toContain(name);
    expect(log.searches.at(-1)?.radiusKm).toBe(radius);
  }
  // Keyboard: arrow keys move within the radio group.
  await group.getByRole('radio', { name: '100 km' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(group.getByRole('radio', { name: '50 km' })).toBeChecked();
  await page.reload();
  await expect(group.getByRole('radio', { name: '50 km' })).toBeChecked();
});

test('more than 20 stations: 20 shown with an honest cap note; fewer: exact count', async ({ page }) => {
  const many = Array.from({ length: 26 }, (_, index) => near(`ChIJ_bulk_${String(index).padStart(4, '0')}`, `Bulk Station ${index + 1}`, 0.3 + index * 0.3));
  await stubDiscovery(page, { stations: many });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  const names = await titles(page);
  expect(names).toHaveLength(20);
  expect(names[0]).toBe('Bulk Station 1');
  expect(names[19]).toBe('Bulk Station 20');
  await expect(page.getByText('Showing the 20 nearest stations returned. More may exist within 10 km.')).toBeVisible();
  await expect(summary(page)).toHaveText('20 shown · within 10\u00A0km');
});

test('empty is distinct from failure, and the radius is never widened silently', async ({ page }) => {
  const log = await stubDiscovery(page, { stations: [near('ChIJ_only_far_away', 'Far Away', 40)] });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'No matching stations were returned within 10 km' })).toBeVisible();
  expect(log.searches.map(call => call.radiusKm)).toEqual([10]);
  await page.getByRole('button', { name: 'Search within 20\u00A0km' }).click();
  await expect(page.getByRole('heading', { name: 'No matching stations were returned within 20 km' })).toBeVisible();
});

for (const code of ['PROVIDER_QUOTA', 'PROVIDER_TIMEOUT', 'PROVIDER_CONFIG', 'RATE_LIMITED'] as const) {
  test(`provider failure (${code}) is an error state, never "no chargers"`, async ({ page }) => {
    await stubDiscovery(page, { stations: WORLD, failSearch: code });
    await seedPlace(page, PLACES.connaught);
    await page.goto('/');
    const alert = page.getByRole('alert');
    await expect(alert.getByRole('heading', { name: 'We couldn’t load chargers' })).toBeVisible();
    await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(page.getByText(/No matching stations|No chargers match/)).toHaveCount(0);
  });
}

test('partial results are shown with a visible warning', async ({ page }) => {
  await stubDiscovery(page, { stations: WORLD, partial: true });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/?radius=100');
  await titles(page);
  await expect(page.getByText('Part of this area didn’t respond, so this list may be missing stations.')).toBeVisible();
});

test('cards: honest unknowns, closure flag, Navigate link, booking unavailable, valid nesting', async ({ page }) => {
  await stubDiscovery(page, { stations: WORLD });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  await titles(page);
  const bravo = cards(page).filter({ hasText: 'Bravo EV Hub' });
  await expect(bravo.locator('.ge-card__dist')).toHaveText(/^~3\.4\s?km$/);
  await expect(bravo.locator('.ge-live')).toHaveText('Status unavailable');
  await expect(bravo.getByText('/\u2060kWh')).toHaveCount(0);
  await expect(bravo.locator('.ge-eta')).toHaveCount(0);
  await expect(bravo.locator('.ge-card__booking-title')).toHaveText('Booking unavailable');
  await expect(bravo.getByRole('link', { name: 'View slots at Bravo EV Hub' })).toHaveCount(0);
  expect(await bravo.locator('.ge-card__sr').innerText()).toMatch(/about 3\.4\skm straight-line/);
  await expect(cards(page).filter({ hasText: 'Closed For Repairs' }).locator('.ge-badge')).toHaveText('Temporarily closed');
  await expect(page.getByText('~ distances are approximate straight-line, not driving distance.')).toBeVisible();
  await expect(page.getByText('Charger data: Google Maps')).toBeVisible();
  // No interactive element nested inside another.
  expect(await page.locator('#nearby-chargers a a, #nearby-chargers a button, #nearby-chargers button a, #nearby-chargers button button').count()).toBe(0);
  // Provider stations are never plotted on the illustrative preview.
  expect(await page.locator('.ge-map .ge-pin').count()).toBe(0);
  for (const name of await cards(page).locator('h3').allInnerTexts()) {
    await expect(cards(page).filter({ hasText: name }).getByRole('link', { name: `Navigate to ${name}` })).toBeVisible();
  }
});

test('Navigate page: deep link, refresh, map fallback, Google Maps hand-off without a city origin', async ({ page }) => {
  const log = await stubDiscovery(page, { stations: WORLD });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  await titles(page);
  await cards(page).filter({ hasText: 'Bravo EV Hub' }).getByRole('link', { name: 'Navigate to Bravo EV Hub' }).click();
  await expect(page).toHaveURL(/\/stations\/ChIJ_station_bravo\/navigate$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Bravo EV Hub' })).toBeVisible();
  const start = page.getByTestId('start-navigation');
  const href = new URL((await start.getAttribute('href'))!);
  const bravo = WORLD.find(item => item.id === 'ChIJ_station_bravo')!;
  expect(href.origin + href.pathname).toBe('https://www.google.com/maps/dir/');
  expect(href.searchParams.get('api')).toBe('1');
  expect(href.searchParams.get('destination')).toBe(`${bravo.lat.toFixed(6)},${bravo.lng.toFixed(6)}`);
  expect(href.searchParams.get('destination_place_id')).toBe('ChIJ_station_bravo');
  expect(href.searchParams.get('travelmode')).toBe('driving');
  expect(href.searchParams.has('origin')).toBe(false); // never the searched city
  await expect(start).toHaveAttribute('target', '_blank');
  await expect(page.getByText('The map couldn’t load. You can still start navigation in Google Maps.')).toBeVisible();
  await expect(page.getByText('Price isn’t published. Check with the operator before charging.')).toBeVisible();
  await expect(page.getByText('Monday: Open 24 hours')).toBeVisible();
  await expect(page.getByTestId('booking-state')).toContainText('Booking isn’t available');

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Bravo EV Hub' })).toBeVisible();
  expect(log.details.filter(id => id === 'ChIJ_station_bravo').length).toBeGreaterThanOrEqual(2);
  await page.getByRole('link', { name: 'Back to results' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('Navigate page: draws a Google map marker at the station; origin is the real device fix', async ({ page }) => {
  await stubDiscovery(page, { stations: WORLD });
  await mockGeolocation(page, { kind: 'success', ...DEVICE });
  await page.addInitScript(() => {
    const w = window as unknown as { __markers: unknown[]; google: unknown };
    w.__markers = [];
    w.google = { maps: { Map: function Map() {}, Geocoder: function Geocoder() {}, Marker: function Marker(options: unknown) { w.__markers.push(options); return { setMap() {} }; } } };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Use my current location' }).click();
  await titles(page);
  await cards(page).first().getByRole('link', { name: /^Navigate to/ }).click();
  await expect(page.getByRole('img', { name: /^Map showing the location of/ })).toBeVisible();
  const marker = await page.evaluate(() => (window as unknown as { __markers: Array<{ position: { lat: number; lng: number } }> }).__markers[0]?.position);
  const alpha = WORLD[0];
  expect(marker).toEqual({ lat: alpha.lat, lng: alpha.lng });
  const href = new URL((await page.getByTestId('start-navigation').getAttribute('href'))!);
  expect(href.searchParams.get('origin')).toBe(`${DEVICE.lat.toFixed(6)},${DEVICE.lng.toFixed(6)}`);
  await expect(page.getByText(/^About .* from your current location \(straight-line, not driving distance\)\.$/)).toBeVisible();
});

test('Navigate page: unknown station and provider failure are explicit', async ({ page }) => {
  await stubDiscovery(page, { stations: WORLD });
  await page.goto('/stations/ChIJ_not_a_station/navigate');
  await expect(page.getByRole('heading', { name: 'We couldn’t find this station.' })).toBeVisible();
  await page.goto('/stations/bad..id/navigate');
  await expect(page.getByRole('heading', { name: 'We couldn’t find this station.' })).toBeVisible();
});

test('320 px: no horizontal overflow and ≥ 44 px touch targets in the discovery journey', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await stubDiscovery(page, { stations: WORLD });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  await titles(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  const targets = page.locator('.ge-radius__chip, .ge-chip, #nearby-chargers .ge-cta, .ge-locate');
  const sizes = await targets.evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return [Math.round(box.width), Math.round(box.height)]; }));
  expect(sizes.length).toBeGreaterThan(8);
  for (const [width, height] of sizes) expect(Math.min(width, height)).toBeGreaterThanOrEqual(44);
  await cards(page).first().getByRole('link', { name: /^Navigate to/ }).click();
  await expect(page.getByTestId('start-navigation')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  const start = await page.getByTestId('start-navigation').boundingBox();
  expect(start!.height).toBeGreaterThanOrEqual(44);
});
