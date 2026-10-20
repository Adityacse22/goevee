import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, currentTheme, saveTheme, storedTheme, type Theme } from '@/lib/theme';
import { t } from '@/lib/messages';
import { IconButton } from './IconButton';

/** Defaults to the system theme, remembers an explicit choice, never flashes (see index.html). */
export function ThemeToggle() {
  // `document` is absent during the build-time prerender.
  const [theme, setTheme] = useState<Theme>(() => (typeof document === 'undefined' ? 'light' : currentTheme()));

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const follow = () => {
      if (storedTheme()) return;
      const next: Theme = media.matches ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener('change', follow);
    return () => media.removeEventListener('change', follow);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
    setTheme(next);
  };

  return (
    <IconButton label={theme === 'dark' ? t.shell.themeToLight : t.shell.themeToDark} onClick={toggle}>
      {theme === 'dark' ? <Sun strokeWidth={1.75} /> : <Moon strokeWidth={1.75} />}
    </IconButton>
  );
}
