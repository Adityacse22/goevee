/**
 * Keeps vercel.json's CSP in sync with the inline theme script in index.html.
 * The script must run before first paint (no theme flash), and the CSP has no
 * 'unsafe-inline', so the exact script body is allowed by its SHA-256 hash.
 * Run after editing that script: node scripts/sync-csp-hash.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const html = readFileSync('index.html', 'utf8');
const inline = html.match(/<script>([\s\S]*?)<\/script>/);
if (!inline) throw new Error('No inline <script> found in index.html');
const hash = `'sha256-${createHash('sha256').update(inline[1]).digest('base64')}'`;

const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const csp = config.headers[0].headers.find(header => header.key === 'Content-Security-Policy');
csp.value = csp.value.replace(/script-src 'self'( 'sha256-[^']+')*/, `script-src 'self' ${hash}`);
writeFileSync('vercel.json', `${JSON.stringify(config, null, 2)}\n`);
console.log(`CSP script hash: ${hash}`);
