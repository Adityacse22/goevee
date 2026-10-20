/**
 * GoEvee — theme preference. The inline script in index.html applies the same
 * rules before first paint, so React only takes over toggling.
 * Keep THEME_KEY and THEME_COLORS in sync with that script.
 */
export type Theme = 'light' | 'dark';

export const THEME_KEY = 'goevee.theme';
export const THEME_COLORS: Record<Theme, string> = { light: '#F8FAFC', dark: '#0A0F14' };

export function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.setAttribute('content', THEME_COLORS[theme]));
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // The choice still applies to this page view.
  }
}
