/**
 * Property 1 (bugfix: explore real-location chargers), on the discovery API:
 * Explore shows provider stations for the chosen centre — never the mock
 * catalogue — re-fetches when the centre changes, degrades unknown fields
 * honestly, and links the preview to the real map page with the centre.
 */
import { test, expect, type Page } from '@playwright/test';
import { eastOf, PLACES, seedPlace, stubDiscovery } from './helpers/discovery';

const MORNING = new Date(Date.UTC(2026, 8, 27, 5, 12));
const MOCK_NAMES = ['ChargeHub City Centre', 'VoltPoint Expressway', 'ElectraGo Tech Park', 'GreenWatt Hub', 'SparkLane Galleria'];
const DELHI = { id: 'ChIJ_realdata_delhi', name: 'Stubbed Delhi Charger', ...eastOf(PLACES.connaught.coords, 1.5) };
const BENGALURU = { id: 'ChIJ_realdata_blr01', name: 'Stubbed Bengaluru Charger', ...eastOf(PLACES.koramangala.coords, 2) };

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(MORNING);
  await page.addInitScript(() => {
    localStorage.setItem('evee.consent.v1', JSON.stringify({ version: 1, analytics: false, updatedAt: Date.UTC(2026, 8, 20) }));
  });
});

const titles = async (page: Page) => {
  await expect(page.locator('#nearby-chargers article').first()).toBeVisible();
  return page.locator('#nearby-chargers article h3').allInnerTexts();
};

test('Property 1 — Explore lists provider stations for the centre, not the mock set', async ({ page }) => {
  await stubDiscovery(page, { stations: [DELHI, BENGALURU] });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  const names = await titles(page);
  expect(names).toEqual([DELHI.name]);
  for (const mock of MOCK_NAMES) expect(names).not.toContain(mock);
});

test('Property 1 — choosing a far place re-fetches so the list reflects the new coordinates', async ({ page }) => {
  const log = await stubDiscovery(page, { stations: [DELHI, BENGALURU] });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  await titles(page);
  const input = page.getByRole('combobox', { name: 'Search a city, area, address or landmark' });
  await input.fill('kora');
  await input.press('Enter');
  await expect(page.getByRole('heading', { name: 'Chargers near Koramangala' })).toBeVisible();
  expect(await titles(page)).toEqual([BENGALURU.name]);
  expect(log.searches.at(-1)).toMatchObject(PLACES.koramangala.coords);
});

test('Property 1 — a station without availability, price or hours degrades honestly', async ({ page }) => {
  await stubDiscovery(page, { stations: [DELHI] });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  await titles(page);
  const card = page.locator('#nearby-chargers article').first();
  await expect(card.locator('.ge-live')).toHaveText('Status unavailable');
  await expect(card.locator('.ge-spec__value', { hasText: 'Hours unavailable' })).toBeVisible();
  await expect(card.getByText('/\u2060kWh')).toHaveCount(0);
  expect(await card.locator('.ge-card__sr').innerText()).not.toContain('rupees');
});

test('Property 1 — the map preview opens /ev-charger-station with the centre, not /map', async ({ page }) => {
  await stubDiscovery(page, { stations: [DELHI] });
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  await titles(page);
  const href = await page.locator('.ge-map--mobile').getAttribute('href');
  expect(href).toMatch(/^\/ev-charger-station\?/);
  expect(href).toContain(`lat=${PLACES.connaught.coords.lat}`);
  expect(href).toContain(`lng=${PLACES.connaught.coords.lng}`);
});
