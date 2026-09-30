import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const publicPages = ['/', '/privacy', '/terms', '/cookies', '/about', '/help'];
test.beforeEach(async ({ page }) => {
  await page.route('https://maps.googleapis.com/**', route => route.abort());
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
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
  await page.goto('/');
  const links = await page.locator('footer a[href^="/"]').evaluateAll(elements => elements.map(element => element.getAttribute('href')!));
  for (const href of links) expect((await request.get(href)).status(), href).toBe(200);
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
  await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
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
  await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
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
    if (await page.getByRole('button', { name: 'Reject analytics', exact: true }).count()) await page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    violations.push(...results.violations.map(v => ({ path, id: v.id, nodes: v.nodes.map(n => n.target) })));
    await page.screenshot({ path: `artifacts/${path.replaceAll('/', '') || 'home'}-${width}.png`, fullPage: true });
  }
  await page.goto('/');
  await page.locator('footer').waitFor();
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
  await page.screenshot({ path: `artifacts/home-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.locator('#navigation-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#navigation-menu')).toHaveCount(0);
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
