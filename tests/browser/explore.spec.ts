/**
 * Explore screen — discovery world. Stations come from /api/v1/discovery
 * (stubbed in tests/browser/helpers/discovery.ts) around a chosen place
 * (Connaught Place, restored from sessionStorage as after a reload).
 *
 * Guards: provider data only (never the mock catalogue), honest unknowns
 * (no price, "Status unavailable" without published availability), the
 * Navigate CTA hierarchy, opt-in "Available now", filters/sort in the URL,
 * offline state, theming, keyboard paths, and layout + axe at many widths.
 */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ccs2, eastOf, PLACES, seedPlace, stubDiscovery, type FixtureStation } from './helpers/discovery';

// 27 Sep 2026, 10:42 AM IST — equal to the stub's retrievedAt, so published availability reads "Live".
const MORNING = new Date(Date.UTC(2026, 8, 27, 5, 12));
const CP = PLACES.connaught.coords;
const type2 = (count: number, maxPowerKw = 22) => ({ kind: 'TYPE2' as const, maxPowerKw, count, availableCount: null, outOfServiceCount: null, availabilityUpdatedAt: null });

const ALPHA: FixtureStation = { id: 'ChIJ_explore_alpha', name: 'Alpha Charge Point', ...eastOf(CP, 0.8), connectors: [ccs2(1, 1, 60)] };
const GAMMA: FixtureStation = { id: 'ChIJ_explore_gamma', name: 'Gamma Type2 Point', ...eastOf(CP, 1.6), connectors: [type2(1)] };
const BETA: FixtureStation = { id: 'ChIJ_explore_beta1', name: 'Beta Fast Charger', ...eastOf(CP, 2.4), connectors: [ccs2(1, 1, 120), ccs2(1, 1, 60)] };
const DELTA: FixtureStation = { id: 'ChIJ_explore_delta', name: 'Delta Combo Hub', ...eastOf(CP, 3.2), connectors: [ccs2(1, null, 60), type2(1)] };
const STUBS = [ALPHA, GAMMA, BETA, DELTA];
const ALL = [ALPHA.name, GAMMA.name, BETA.name, DELTA.name];
const PUBLISHED = [ALPHA.name, BETA.name];
const MOCK_NAMES = ['ChargeHub City Centre', 'VoltPoint Expressway', 'ElectraGo Tech Park', 'GreenWatt Hub', 'SparkLane Galleria'];

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(MORNING);
  await page.addInitScript(() => {
    localStorage.setItem('evee.consent.v1', JSON.stringify({ version: 1, analytics: false, updatedAt: Date.UTC(2026, 8, 20) }));
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') (window as Window & { classAtParse?: string }).classAtParse = document.documentElement.className;
    });
  });
  await stubDiscovery(page, { stations: STUBS });
  await seedPlace(page, PLACES.connaught);
});

const list = (page: Page) => page.locator('#nearby-chargers article');
/** Waits for finite animations (result stagger, sheet transitions) so reads see the settled UI. */
async function settle(page: Page) {
  await page.waitForFunction(() => document.getAnimations().every(animation => {
    const timing = animation.effect?.getComputedTiming();
    return animation.playState !== 'running' || timing?.iterations === Infinity;
  }));
}
async function titles(page: Page) {
  await expect(list(page).first()).toBeVisible();
  await settle(page);
  return list(page).locator('h3').allInnerTexts();
}
const chip = (page: Page, name: string | RegExp) => page.getByRole('group', { name: 'Quick filters' }).getByRole('button', { name });
const card = (page: Page, name: string) => list(page).filter({ hasText: name });

test('default view lists every provider station by distance with the Navigate CTA hierarchy', async ({ page }) => {
  await page.goto('/');
  expect(await titles(page)).toEqual(ALL);
  for (const mock of MOCK_NAMES) expect(await titles(page)).not.toContain(mock);
  await expect(chip(page, 'Available now')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('heading', { name: 'Chargers near Connaught Place' })).toBeVisible();

  // The preview links to the real map page with the centre, never to /map, and draws no provider pins.
  const map = page.getByRole('link', { name: /^Illustration of the search area around Connaught Place/ });
  const href = await map.getAttribute('href');
  expect(href).toMatch(/^\/ev-charger-station\?/);
  expect(href).toMatch(/[?&]lat=/);
  expect(await map.locator('.ge-pin').count()).toBe(0);

  await expect(list(page).nth(0).locator('.ge-cta')).toHaveAttribute('data-variant', 'primary');
  await expect(list(page).nth(1).locator('.ge-cta')).toHaveAttribute('data-variant', 'secondary');
  await expect(list(page).nth(0).locator('.ge-cta')).toHaveAccessibleName('Navigate to Alpha Charge Point');

  const alphaSummary = await card(page, ALPHA.name).locator('.ge-card__sr').innerText();
  expect(alphaSummary).toMatch(/, live,/);
  expect(alphaSummary).toContain('hours unavailable');
  expect(alphaSummary).not.toContain('rupees per kilowatt-hour');
  await expect(card(page, ALPHA.name).getByText('/\u2060kWh')).toHaveCount(0);
  await expect(card(page, ALPHA.name).locator('.ge-live')).toHaveText('Live');
});

test('a station with no published availability reads "Status unavailable"', async ({ page }) => {
  await page.goto('/');
  await titles(page);
  const gamma = card(page, GAMMA.name);
  await expect(gamma.locator('.ge-live')).toHaveText('Status unavailable');
  await expect(gamma.locator('.ge-live-dot')).toHaveCount(0);
  await expect(gamma.locator('.ge-spec__value', { hasText: 'Hours unavailable' })).toBeVisible();
  await expect(gamma.locator('.ge-badge')).toHaveText('Availability unknown');
});

test('quick filters combine on one connector and sync to the URL', async ({ page }) => {
  await page.goto('/');
  expect(await titles(page)).toEqual(ALL);

  await chip(page, 'Available now').click();
  await expect(page).toHaveURL(/available=1/);
  expect(await titles(page)).toEqual(PUBLISHED);

  await chip(page, 'CCS2').click();
  await expect(page).toHaveURL(/connector=ccs2/);
  expect(await titles(page)).toEqual(PUBLISHED);

  await chip(page, /Fast 60/).click();
  expect(await titles(page)).toEqual(PUBLISHED);
  await expect(page).toHaveURL(/available=1&connector=ccs2&minKw=60/);
  await expect(page).toHaveURL(url => !url.searchParams.has('maxPrice'));

  await page.reload();
  expect(await titles(page)).toEqual(PUBLISHED);
  await expect(chip(page, /Fast 60/)).toHaveAttribute('aria-pressed', 'true');
});

test('switching to the Ather 450X relabels the connector chip to LECCS', async ({ page }) => {
  await page.goto('/');
  await titles(page);
  await page.getByRole('button', { name: /^Tata Nexon EV, 42% battery, about 180 km range\. Change vehicle\.$/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Your vehicles' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('radio', { name: /Ather 450X/ }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('button', { name: /^Ather 450X, 76% battery/ })).toBeVisible();
  await expect(chip(page, 'LECCS')).toBeVisible();
  await chip(page, 'LECCS').click();
  // No provider station reports LECCS, so the filter honestly empties the list.
  await expect(list(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No chargers match these filters' })).toBeVisible();
});

test('sort sheet and See all carry sort and radius', async ({ page }) => {
  await page.goto('/?radius=20');
  await titles(page);
  await page.getByRole('button', { name: 'Sorted by distance' }).click();
  await page.getByRole('dialog', { name: 'Sort chargers' }).getByRole('radio', { name: 'Highest power' }).click();
  await expect(page.getByRole('button', { name: 'Sorted by power' })).toBeVisible();
  expect((await titles(page))[0]).toBe(BETA.name);
  await expect(page.getByRole('link', { name: 'See all nearby chargers' })).toHaveAttribute('href', '/chargers?sort=power&radius=20');
});

test('offline keeps the shown results with their retrieval time', async ({ page, context }) => {
  await page.goto('/');
  await titles(page);
  await context.setOffline(true);
  await expect(page.getByRole('status').filter({ hasText: /^Offline — showing status from 10:4[12]\sAM$/ })).toBeVisible();
  expect(await titles(page)).toEqual(ALL);
  await context.setOffline(false);
});

test('dark mode persists and is applied before the app loads', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  expect(await page.evaluate(() => (window as Window & { classAtParse?: string }).classAtParse)).toMatch(/dark.*ge-shell|ge-shell.*dark/);
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(10, 15, 20)');
});

test('keyboard: skip link, chips, sheets and focus return', async ({ page }) => {
  await page.goto('/');
  await titles(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to nearby chargers' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#nearby-chargers')).toBeFocused();

  await chip(page, 'CCS2').focus();
  await page.keyboard.press('Space');
  await expect(chip(page, 'CCS2')).toHaveAttribute('aria-pressed', 'true');

  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog).toBeVisible();
  // Focus moves into the sheet, stays trapped, and returns to the trigger on Escape.
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await expect(dialog.getByRole('link', { name: 'Privacy' })).toBeVisible();
  for (let i = 0; i < 12; i += 1) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(menu).toBeFocused();

  const vehicle = page.getByRole('button', { name: /^Tata Nexon EV/ });
  await vehicle.focus();
  await page.keyboard.press('Enter');
  const garage = page.getByRole('dialog', { name: 'Your vehicles' });
  await expect(garage.getByRole('radio', { name: /Tata Nexon EV/ })).toBeFocused();
  // A real key press: Radix checks a radio on arrow-key focus only while the key is down.
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(60);
  await page.keyboard.up('ArrowDown');
  // Arrow keys select without closing (the page behind is hidden from assistive tech while open).
  await expect(garage.getByRole('radio', { name: /Ather 450X/ })).toBeChecked();
  await expect(garage).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(garage).toBeHidden();
  await expect(page.getByRole('button', { name: /^Ather 450X/ })).toBeFocused();
});

for (const [width, height] of [[320, 740], [360, 800], [390, 844], [412, 915], [430, 932], [768, 1024], [1024, 768], [1280, 800], [1440, 900]]) {
  test(`layout and axe at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await titles(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme' }).click();
      await settle(page);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map(v => `${theme}: ${v.id} ${v.nodes.map(n => n.target).join(' ')}`)).toEqual([]);
    }
  });
}
