import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pageMetadata, getPageMetadata, SITE_URL } from '../src/config/site';

const template = await readFile('dist/index.html', 'utf8');
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function htmlFor(path: string) {
  const page = getPageMetadata(path);
  let html = template.replace(/<title>.*?<\/title>/, `<title>${escape(page.title)}</title>`);
  for (const [attribute, key, value] of [
    ['name', 'description', page.description], ['name', 'robots', page.index ? 'index, follow' : 'noindex, follow'],
    ['property', 'og:title', page.title], ['property', 'og:description', page.description], ['property', 'og:url', SITE_URL + page.path],
    ['name', 'twitter:title', page.title], ['name', 'twitter:description', page.description],
  ]) html = html.replace(new RegExp(`<meta ${attribute}="${key}" content="[^"]*"\\s*/?>`), `<meta ${attribute}="${key}" content="${escape(value)}" />`);
  return html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${escape(SITE_URL + page.path)}" />`);
}
for (const path of [...Object.keys(pageMetadata), '/search']) {
  const directory = path === '/' ? 'dist' : `dist${path}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, htmlFor(path));
}
await writeFile('dist/404.html', htmlFor('/404'));
// Station IDs are only known at request/navigation time; never emit an invented canonical.
await writeFile('dist/station.html', htmlFor('/stations/station')
  .replace(/<link rel="canonical"[^>]*>/, '')
  .replace(/<meta property="og:url"[^>]*>/, ''));
const publicPaths = Object.entries(pageMetadata).filter(([, page]) => page.index).map(([path]) => path);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPaths.map(path => `  <url><loc>${SITE_URL}${path}</loc></url>`).join('\n')}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
await writeFile('public/sitemap.xml', sitemap);
await writeFile('dist/sitemap.xml', sitemap);
await writeFile('public/robots.txt', robots);
await writeFile('dist/robots.txt', robots);
console.log(`Generated metadata for ${Object.keys(pageMetadata).length} routes, 404, sitemap and robots.txt.`);
