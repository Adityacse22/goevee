import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  test.skip(process.env.TEST_ANALYTICS !== '1', 'Run against a build with a test GA measurement ID and TEST_ANALYTICS=1.');
  await page.route('https://maps.googleapis.com/**', route => route.abort());
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
});

for (const blockRemoval of [false, true]) {
  test(`withdrawing consent stays effective when storage writes${blockRemoval ? ' and removal' : ''} fail`, async ({ page }) => {
    const analyticsRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('googletagmanager.com')) analyticsRequests.push(request.url());
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
    await expect(page.locator('#evee-analytics')).toHaveCount(1);
    const measurementId = new URL((await page.locator('#evee-analytics').getAttribute('src'))!).searchParams.get('id')!;
    expect(analyticsRequests).toHaveLength(1);

    await page.evaluate(({ blockRemoval }) => {
      const originalSet = Storage.prototype.setItem;
      const originalRemove = Storage.prototype.removeItem;
      Storage.prototype.setItem = function (key, value) {
        if (this === localStorage && key === 'evee.consent.v1') throw new DOMException('Storage write blocked', 'QuotaExceededError');
        return originalSet.call(this, key, value);
      };
      Storage.prototype.removeItem = function (key) {
        if (blockRemoval && this === localStorage && key === 'evee.consent.v1') throw new DOMException('Storage removal blocked', 'SecurityError');
        return originalRemove.call(this, key);
      };
      (window as Window & { consentTestDocument?: boolean }).consentTestDocument = true;
      document.cookie = '_ga=previous-grant; Path=/';
    }, { blockRemoval });

    await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
    await page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Your privacy choices' })).toHaveCount(0);
    expect(await page.evaluate(() => (window as Window & { consentTestDocument?: boolean }).consentTestDocument)).toBe(true);
    expect(await page.evaluate(id => (window as unknown as Record<string, unknown>)[`ga-disable-${id}`], measurementId)).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toContain('_ga=');
    const stored = await page.evaluate(() => localStorage.getItem('evee.consent.v1'));
    if (blockRemoval) expect(JSON.parse(stored!).analytics).toBe(true);
    else expect(stored).toBeNull();

    const queuedEvents = await page.evaluate(() => (window as Window & { dataLayer?: unknown[] }).dataLayer?.length);
    await page.locator('footer').getByRole('link', { name: 'Privacy policy', exact: true }).click();
    await expect(page).toHaveURL('/privacy');
    expect(await page.evaluate(() => (window as Window & { consentTestDocument?: boolean }).consentTestDocument)).toBe(true);
    expect(await page.evaluate(id => (window as unknown as Record<string, unknown>)[`ga-disable-${id}`], measurementId)).toBe(true);
    expect(await page.evaluate(() => (window as Window & { dataLayer?: unknown[] }).dataLayer?.length)).toBe(queuedEvents);
    expect(analyticsRequests).toHaveLength(1);
  });
}
