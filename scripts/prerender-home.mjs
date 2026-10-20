/**
 * Injects the prerendered Explore first frame into dist/index.html (the "/" page
 * only — other routes are generated from the clean template beforehand).
 * The frame is inert until the app mounts, so taps and typing can't be lost
 * when React replaces it.
 */
import { readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const SSR_DIR = 'node_modules/.cache/goevee-ssr';
const { render } = await import(pathToFileURL(resolve(SSR_DIR, 'prerender.js')).href);
const markup = render('/');
const file = 'dist/index.html';
const html = await readFile(file, 'utf8');
if (!html.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root to fill');
const frame = `<div id="root"><div class="ge-prepaint" inert aria-busy="true">${markup}</div></div>`;
await writeFile(file, html.replace('<div id="root"></div>', frame));
await rm(SSR_DIR, { recursive: true, force: true });
console.log(`Prerendered the Explore first frame into ${file} (${(markup.length / 1024).toFixed(1)} KB of HTML).`);
