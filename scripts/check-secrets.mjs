import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { parse } from 'dotenv';

const allowed = new Set([
  'VITE_GOOGLE_MAPS_API_KEY', 'VITE_API_BASE_URL', 'VITE_GA_MEASUREMENT_ID', 'VITE_TURNSTILE_SITE_KEY',
]);
const isAllowed = (name) => allowed.has(name) || name.startsWith('VITE_VERCEL_');
function sourceFiles(directory = '.') {
  const excluded = new Set(['node_modules', 'dist', '.git', 'artifacts', 'test-results', 'playwright-report', '.agent', '.gemini', '.gsd']);
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (excluded.has(entry.name)) return [];
    const file = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : [file];
  });
}
let files;
try { files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n'); }
catch { files = sourceFiles(); } // Build providers may omit .git from the checkout.

const errors = [];
const serverSecrets = [];
for (const file of ['.env', '.env.local', '.env.production', '.env.production.local', 'server/.env']) {
  if (!existsSync(file)) continue;
  for (const [name, value] of Object.entries(parse(readFileSync(file)))) {
    if (name.startsWith('VITE_') && !isAllowed(name)) errors.push(`${file}: unapproved public variable ${name}`);
    if (!name.startsWith('VITE_') && /SECRET|PASSWORD|TOKEN|DATABASE_URL|API_KEY/.test(name) && value.length > 12) serverSecrets.push({ name, value });
  }
}
for (const name of Object.keys(process.env)) {
  if (name.startsWith('VITE_') && !isAllowed(name)) errors.push(`environment: unapproved public variable ${name}`);
  const value = process.env[name];
  if (!name.startsWith('VITE_') && /^(JWT_.*SECRET|JWT_SECRET|DATABASE_URL|TURNSTILE_SECRET_KEY|GOOGLE_MAPS_API_KEY|OCM_API_KEY)$/.test(name) && value?.length > 12) serverSecrets.push({ name, value });
}
for (const file of files) {
  if (!existsSync(file) || /(?:^|\/)\.env(?:\.|$)/.test(file) || /\.(?:png|jpg|jpeg|gif|webp|ico|svg|woff|woff2|ttf|eot|lockb|mp4|mov|pdf|zip|gz)$/i.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  if (/AIza[\w-]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bsk-(?:live-|proj-)?[A-Za-z0-9_-]{24,}/.test(text)) errors.push(`${file}: hardcoded credential pattern (redacted)`);
  if (file.startsWith('src/') && /(?:from\s*|import\s*\()["'][^"']*\bserver\//.test(text)) errors.push(`${file}: browser code imports server code`);
  for (const { name, value } of serverSecrets) if (text.includes(value)) errors.push(`${file}: contains ${name} value (redacted)`);
}
if (process.argv.includes('--dist')) {
  function scan(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) scan(file);
      else if (/\.(js|html|json|map)$/.test(file)) {
        const text = readFileSync(file, 'utf8');
        for (const { name, value } of serverSecrets) if (text.includes(value)) errors.push(`${file}: contains server-only ${name} (redacted)`);
      }
    }
  }
  scan('dist');
}
if (errors.length) { console.error([...new Set(errors)].join('\n')); process.exit(1); }
console.log('Secret checks passed: public variable allowlist, source scan and server-secret scan' + (process.argv.includes('--dist') ? ' of production assets.' : '.'));
