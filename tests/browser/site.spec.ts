import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { ccs2, eastOf, PLACES, seedPlace, stubDiscovery } from './helpers/discovery';

/** Home list fixtures: the Explore page now reads /api/v1/discovery around a chosen place. */
const HOME_DISCOVERY = [
  { id: 'ChIJ_site_alpha_01', name: 'Alpha Charge Point', ...eastOf(PLACES.connaught.coords, 1), connectors: [ccs2(1, 1)] },
  { id: 'ChIJ_site_beta_002', name: 'Beta Fast Charger', ...eastOf(PLACES.connaught.coords, 2), connectors: [ccs2(2, 2, 120)] },
];

const publicPages = ['/', '/privacy', '/terms', '/cookies', '/about', '/help'];

/**
 * Two published-availability EV stations near Sector 62, Noida. The home list is
 * now backed by `searchNearbyEVStations` (Google Places New), so without a stub
 * the list never renders and the a11y pass has nothing to measure. Both carry a
 * published availableCount so they survive the default "Available now" view.
 */
const HOME_STUBS = [
  { id: 'site-alpha', name: 'Alpha Charge Point', lat: 28.6300, lng: 77.3680, aggs: [{ type: 'CCS_COMBO_2', maxChargeRateKw: 60, count: 1, availableCount: 1 }] },
  { id: 'site-beta', name: 'Beta Fast Charger', lat: 28.6360, lng: 77.3720, aggs: [{ type: 'CCS_COMBO_2', maxChargeRateKw: 120, count: 1, availableCount: 1 }, { type: 'CCS_COMBO_2', maxChargeRateKw: 60, count: 1, availableCount: 1 }] },
];

/**
 * Install a stub for `window.google.maps` BEFORE any app script runs, so the
 * app's `searchNearbyEVStations` path resolves our fixed set and the loader
 * reports ready. Mirrors the stub shape from tests/browser/explore.spec.ts. This
 * stub creates no <script> tag, so it does not conflict with the maps.googleapis
 * route guard; it is independent of consent and harmless to non-home pages.
 */
async function stubGoogleMaps(page: Page) {
  await page.addInitScript(({ stubs }) => {
    const latLng = (lat: number, lng: number) => ({ lat: () => lat, lng: () => lng });
    const place = (s: typeof stubs[number]) => ({
      id: s.id,
      displayName: s.name,
      formattedAddress: `${s.name} Road, Noida`,
      location: latLng(s.lat, s.lng),
      businessStatus: 'OPERATIONAL',
      rating: 0,
      userRatingCount: 0,
      evChargeOptions: { connectorCount: s.aggs.length, connectorAggregations: s.aggs },
    });
    const placesLibrary = {
      Place: { searchNearby: () => Promise.resolve({ places: stubs.map(place) }) },
      SearchNearbyRankPreference: { DISTANCE: 'DISTANCE', POPULARITY: 'POPULARITY' },
    };
    const maps = {
      Map: function () {},
      Marker: function () {},
      InfoWindow: function () {},
      LatLngBounds: function () {},
      Geocoder: function () {},
      places: { AutocompleteService: function () {}, PlacesServiceStatus: { OK: 'OK' } },
      importLibrary: (name: string) => (name === 'places' ? Promise.resolve(placesLibrary) : Promise.reject(new Error('unknown library'))),
    };
    (window as unknown as { google: unknown }).google = { maps };
  }, { stubs: HOME_STUBS });
}

/** Cookie settings live in the footer on legacy pages and in the menu sheet on the GoEvee shell. */
async function openCookieSettings(page: Page) {
  const footerButton = page.locator('footer').getByRole('button', { name: 'Cookie settings', exact: true });
  if (await footerButton.count()) {
    await footerButton.click();
    return;
  }
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: 'Cookie settings', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.route('https://maps.googleapis.com/**', route => route.abort());
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  // The legacy /ev-charger-station page still uses the client SDK; the home page uses discovery.
  await stubGoogleMaps(page);
  await stubDiscovery(page, { stations: HOME_DISCOVERY });
  await seedPlace(page, PLACES.connaught);
});

test('public pages, metadata, links and assets are available', async ({ page, request }) => {
  for (const path of publicPages) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.title()).toContain('Evee');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://www.goevee.in' + path);
    const html = await (await request.get(path)).text();
    expect(html).not.toContain('Lovable');
    expect(html).toContain((await page.title()).replaceAll('&', '&amp;'));
  }
  for (const path of ['/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png', '/social-preview.png', '/site.webmanifest', '/sitemap.xml', '/robots.txt']) expect((await request.get(path)).status()).toBe(200);
  await page.goto('/privacy');
  await page.locator('footer').waitFor();
  const links = await page.locator('footer a[href^="/"]').evaluateAll(elements => elements.map(element => element.getAttribute('href')!));
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'Menu' });
  await expect(menu.getByRole('link', { name: 'Privacy', exact: true })).toBeVisible();
  links.push(...await menu.locator('a[href^="/"]').evaluateAll(elements => elements.map(element => element.getAttribute('href')!)));
  await page.keyboard.press('Escape');
  links.push(...await page.getByRole('navigation', { name: 'Primary' }).locator('a[href^="/"]').evaluateAll(elements => elements.map(element => element.getAttribute('href')!)));
  expect(links.length).toBeGreaterThan(8);
  for (const href of new Set(links)) expect((await request.get(href)).status(), href).toBe(200);
  expect((await request.get('/missing-page-123')).status()).toBe(404);
  await page.goto('/missing-page-123');
  await expect(page.getByRole('heading', { name: 'This stop isn’t on the map.' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

test('consent can be rejected, retained, changed and withdrawn', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', req => { if (req.url().includes('googletagmanager.com')) analyticsRequests.push(req.url()); });
  await page.goto('/?email=private@example.com');
  await expect(page.getByRole('heading', { name: 'Your privacy choices' })).toBeVisible();
  expect(analyticsRequests).toHaveLength(0);
  await page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your privacy choices' })).toHaveCount(0);
  expect(analyticsRequests).toHaveLength(0);
  await openCookieSettings(page);
  await page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('evee.consent.v1')!).analytics)).toBe(true);
  if (process.env.TEST_ANALYTICS === '1') {
    await expect(page.locator('#evee-analytics')).toHaveCount(1);
    expect(analyticsRequests).toHaveLength(1);
    const events = await page.evaluate(() => JSON.stringify((window as Window & { dataLayer?: unknown[] }).dataLayer));
    expect(events).toContain('page_view');
    expect(events).not.toContain('private@example.com');
    await page.evaluate(() => { document.cookie = '_ga=test; Path=/'; });
  }
  await openCookieSettings(page);
  await page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your privacy choices' })).toHaveCount(0);
  expect(await page.evaluate(() => document.cookie)).not.toContain('_ga=');
});

test('signup rejects mismatches and submits normalized values with terms and bot fields', async ({ page }) => {
  await page.goto('/signup');
  await page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
  await page.getByLabel('Full Name', { exact: true }).fill('Test Driver');
  await page.getByLabel('Email', { exact: true }).fill('TEST@example.com');
  await page.getByLabel('Password', { exact: true }).fill('a unique test passphrase');
  await page.getByLabel('Confirm Password', { exact: true }).fill('mismatched passphrase');
  await page.locator('#terms').check();
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
  await expect(page.locator('#form-error')).toHaveText('Passwords do not match.');
  let submitted: Record<string, unknown> = {};
  await page.route('**/api/v1/auth/register', async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Test validation response' }) });
  });
  await page.getByLabel('Confirm Password', { exact: true }).fill('a unique test passphrase');
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
  await expect(page.locator('#form-error')).toHaveText('Test validation response');
  expect(submitted).toMatchObject({ email: 'test@example.com', acceptedTerms: true, website: '', turnstileToken: '' });
});

for (const width of [320, 390, 1440]) test(`mobile layout and accessibility at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const violations: unknown[] = [];
  for (const path of ['/', '/privacy', '/login', '/signup', '/ev-charger-station', '/missing']) {
    await page.goto(path);
    await page.locator('h1').waitFor();
    if (path === '/') await page.locator('#nearby-chargers article').first().waitFor();
    if (await page.getByRole('button', { name: 'Reject analytics', exact: true }).count()) await page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    // Let finite transitions (banner exit, list stagger) finish so contrast is measured on the settled UI.
    await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    violations.push(...results.violations.map(v => ({ path, id: v.id, nodes: v.nodes.map(n => n.target) })));
    await page.screenshot({ path: `artifacts/${path.replaceAll('/', '') || 'home'}-${width}.png`, fullPage: true });
  }
  await page.goto('/');
  await page.locator('#nearby-chargers article').first().waitFor();
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeVisible();
  await page.screenshot({ path: `artifacts/home-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
  // Focus lands in the sheet once its focus trap and Escape handling are active.
  await expect(page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0);
  await page.goto('/privacy');
  await page.getByRole('heading', { name: 'Privacy policy', exact: true }).waitFor();
  await page.locator('footer').waitFor();
  await page.screenshot({ path: `artifacts/privacy-${width}.png`, fullPage: true });
  expect(violations).toEqual([]);
});

test('sitemap excludes private routes and static previews have route-specific metadata', () => {
  const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
  for (const path of ['/privacy', '/terms', '/cookies']) expect(sitemap).toContain(`https://www.goevee.in${path}`);
  for (const path of ['/profile', '/admin', '/login', '/bookings']) expect(sitemap).not.toContain(`https://www.goevee.in${path}`);
  expect(readFileSync('dist/privacy/index.html', 'utf8')).toContain('<title>Privacy policy | Evee</title>');
});


test('light theme keeps privacy text readable', async ({ page }) => {
  await page.goto('/privacy');
  await page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});
