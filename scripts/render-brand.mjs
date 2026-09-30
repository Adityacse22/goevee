import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(`<style>body{margin:0}</style>${await readFile('public/social-preview.svg', 'utf8')}`);
await page.screenshot({ path: 'public/social-preview.png' });
const icon = await readFile('public/favicon.svg', 'utf8');
for (const [size, filename] of [[32, 'favicon-32'], [180, 'apple-touch-icon'], [192, 'icon-192'], [512, 'icon-512']]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>body{margin:0}svg{width:100vw;height:100vh}</style>${icon}`);
  await page.screenshot({ path: `public/${filename}.png`, omitBackground: true });
}
await browser.close();
console.log('Rendered social preview and four PNG icons.');
