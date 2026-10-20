/**
 * Preservation spec (bugfix: explore real-location chargers, Property 2),
 * updated for backend charger discovery. Preserved properties:
 *  - 3.1 / 3.2  no geolocation request on first paint; it fires only on tap;
 *  - 3.3 / 2.10 no Maps JS SDK on the Explore page; the preview is the inline
 *               SVG and non-interactive on phones;
 *  - 3.5        offline keeps the results already on screen with their time —
 *               now WITHOUT persisting Google Places content on the device
 *               (provider caching terms), so a cold offline start says offline;
 *  - 3.7        choosing a place suggestion sets the centre and drives the
 *               list and the preview label.
 */
import { test, expect, type Page } from '@playwright/test';
import { ccs2, eastOf, mockGeolocation, PLACES, seedPlace, stubDiscovery } from './helpers/discovery';

const MORNING = new Date(Date.UTC(2026, 8, 27, 5, 12));
const CP = PLACES.connaught.coords;
const STATIONS = [
  { id: 'ChIJ_preserve_alpha', name: 'Preserve Alpha', ...eastOf(CP, 0.9), connectors: [ccs2(1, 1)] },
  { id: 'ChIJ_preserve_beta1', name: 'Preserve Beta', ...eastOf(CP, 2.1), connectors: [ccs2(1, 1)] },
];

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(MORNING);
  await page.addInitScript(() => {
    localStorage.setItem('evee.consent.v1', JSON.stringify({ version: 1, analytics: false, updatedAt: Date.UTC(2026, 8, 20) }));
  });
  await stubDiscovery(page, { stations: STATIONS });
});

const titles = async (page: Page) => {
  await expect(page.locator('#nearby-chargers article').first()).toBeVisible();
  return page.locator('#nearby-chargers article h3').allInnerTexts();
};

test('3.1/3.2 no geolocation request on first paint; it fires once, only on tap', async ({ page }) => {
  await mockGeolocation(page, { kind: 'success', lat: CP.lat, lng: CP.lng });
  await page.goto('/');
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(0);
  await page.getByRole('button', { name: 'Use current location' }).click();
  await titles(page);
  expect(await page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(1);
});

test('3.3/2.10 no Maps JS SDK on Explore; the preview is the inline SVG and non-interactive', async ({ page }) => {
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  await titles(page);
  expect(await page.locator('script[src*="maps.googleapis.com"]').count()).toBe(0);
  const preview = page.locator('.ge-map--mobile');
  await expect(preview).toBeVisible();
  await expect(preview.locator('.ge-map__base')).toHaveCount(1);
  expect(await preview.locator('.ge-pin--interactive').count()).toBe(0);
});

test('3.5 offline keeps on-screen results with their time; provider data is not persisted', async ({ page, context }) => {
  await seedPlace(page, PLACES.connaught);
  await page.goto('/');
  expect(await titles(page)).toEqual(['Preserve Alpha', 'Preserve Beta']);
  await context.setOffline(true);
  await expect(page.getByRole('status').filter({ hasText: /^Offline — showing status from 10:4[12]\sAM$/ })).toBeVisible();
  expect(await titles(page)).toEqual(['Preserve Alpha', 'Preserve Beta']);
  const stored = await page.evaluate(() => Object.keys(localStorage).filter(key => /station/i.test(key) || (localStorage.getItem(key) ?? '').includes('Preserve Alpha')));
  expect(stored).toEqual([]);
  await context.setOffline(false);
});

test('3.7 choosing a place suggestion sets the centre and drives the list and preview', async ({ page }) => {
  await page.goto('/');
  const input = page.getByRole('combobox', { name: 'Search a city, area, address or landmark' });
  await input.fill('connaught p');
  await page.getByRole('option', { name: /Connaught Place/ }).click();
  await expect(page.getByRole('heading', { name: 'Chargers near Connaught Place' })).toBeVisible();
  expect(await titles(page)).toEqual(['Preserve Alpha', 'Preserve Beta']);
  await expect(page.getByRole('link', { name: /^Illustration of the search area around Connaught Place/ })).toBeVisible();
});
