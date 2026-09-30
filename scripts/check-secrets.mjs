import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { parse } from 'dotenv';

const allowed = new Set([
  'VITE_GOOGLE_MAPS_API_KEY', 'VITE_API_BASE_URL', 'VITE_GA_MEASUREMENT_ID', 'VITE_TURNSTILE_SITE_KEY',
  // Vercel injects these documented public deployment values for its Vite preset.
  // Keep this explicit list synchronized with vite.config.ts.
  // https://vercel.com/docs/environment-variables/framework-environment-variables
  'VITE_VERCEL_ENV', 'VITE_VERCEL_TARGET_ENV', 'VITE_VERCEL_URL', 'VITE_VERCEL_BRANCH_URL',
  'VITE_VERCEL_PROJECT_PRODUCTION_URL', 'VITE_VERCEL_HASH_SALT', 'VITE_VERCEL_GIT_PROVIDER',
  'VITE_VERCEL_GIT_REPO_SLUG', 'VITE_VERCEL_GIT_REPO_OWNER', 'VITE_VERCEL_GIT_REPO_ID',
  'VITE_VERCEL_GIT_COMMIT_REF', 'VITE_VERCEL_GIT_COMMIT_SHA', 'VITE_VERCEL_GIT_COMMIT_MESSAGE',
  'VITE_VERCEL_GIT_COMMIT_AUTHOR_LOGIN', 'VITE_VERCEL_GIT_COMMIT_AUTHOR_NAME', 'VITE_VERCEL_GIT_PULL_REQUEST_ID',
]);
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
    if (name.startsWith('VITE_') && !allowed.has(name)) errors.push(`${file}: unapproved public variable ${name}`);
    if (!name.startsWith('VITE_') && /SECRET|PASSWORD|TOKEN|DATABASE_URL|API_KEY/.test(name) && value.length > 12) serverSecrets.push({ name, value });
  }
}
for (const name of Object.keys(process.env)) {
  if (name.startsWith('VITE_') && !allowed.has(name)) errors.push(`environment: unapproved public variable ${name}`);
  const value = process.env[name];
  if (!name.startsWith('VITE_') && /^(JWT_.*SECRET|JWT_SECRET|DATABASE_URL|TURNSTILE_SECRET_KEY|GOOGLE_MAPS_API_KEY|OCM_API_KEY)$/.test(name) && value?.length > 12) serverSecrets.push({ name, value });
}
for (const file of files) {
  if (!existsSync(file) || /(?:^|\/)\.env(?:\.|$)/.test(file) || /\.(?:png|webp|ico|lockb)$/.test(file)) continue;
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
