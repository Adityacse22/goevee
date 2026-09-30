export const CONSENT_KEY = 'evee.consent.v1';
export const CONSENT_EVENT = 'evee:consent';
export const SETTINGS_EVENT = 'evee:cookie-settings';
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export type Consent = { version: 1; analytics: boolean; updatedAt: number };
let memoryConsent: Consent | null = null;
let memoryOnly = false;

export function parseConsent(value: string | null): Consent | null {
  try {
    const choice = JSON.parse(value ?? 'null');
    if (choice?.version !== 1 || typeof choice.analytics !== 'boolean' ||
      typeof choice.updatedAt !== 'number' || choice.updatedAt > Date.now() ||
      Date.now() - choice.updatedAt >= CONSENT_MAX_AGE) return null;
    return choice;
  } catch { return null; }
}

export function readConsent(): Consent | null {
  if (memoryOnly) return parseConsent(JSON.stringify(memoryConsent));
  try { return parseConsent(localStorage.getItem(CONSENT_KEY)); }
  catch { return parseConsent(JSON.stringify(memoryConsent)); }
}

export function canReloadWithoutAnalytics(): boolean {
  // Reloading discards an in-memory rejection and could revive an older grant.
  if (memoryOnly) return false;
  try { return !parseConsent(localStorage.getItem(CONSENT_KEY))?.analytics; }
  catch { return false; }
}

export function clearAnalyticsCookies() {
  const names = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]).filter(name => /^_ga(?:_|$)|^_gid$|^_gat/.test(name));
  const host = location.hostname.split('.');
  const domains = ['', ...host.map((_, i) => host.slice(i).join('.'))];
  for (const name of names) for (const domain of domains) {
    document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ''} SameSite=Lax`;
  }
}

export function saveConsent(analytics: boolean) {
  memoryConsent = { version: 1, analytics, updatedAt: Date.now() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(memoryConsent));
    memoryOnly = false;
  } catch {
    memoryOnly = true;
    // Quota failures can still allow removal. Clear any stale grant where possible,
    // while retaining this document's choice even if all storage writes are blocked.
    if (!analytics) {
      try { localStorage.removeItem(CONSENT_KEY); } catch { /* Keep the rejection in memory. */ }
    }
  }
  if (!analytics) clearAnalyticsCookies();
  window.dispatchEvent(new Event(CONSENT_EVENT));
  return !memoryOnly;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}
