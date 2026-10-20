import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** useLayoutEffect in the browser, useEffect during the build-time prerender (no warnings). */
export const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Debounces a fast-changing value (search input) by `delay` ms. */
export function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** True once the element has come within `rootMargin` of the viewport. Stays true. */
export function useSeenOnce<T extends Element>(ref: RefObject<T>, rootMargin = '200px'): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || seen) return undefined;
    if (!('IntersectionObserver' in window)) {
      setSeen(true);
      return undefined;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setSeen(true);
        observer.disconnect();
      }
    }, { rootMargin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, seen]);
  return seen;
}

/** True while the element is scrolled above the top of the viewport. */
export function useScrolledPast<T extends Element>(ref: RefObject<T>, offsetPx = 0): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    }, { rootMargin: `-${offsetPx}px 0px 0px 0px` });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, offsetPx]);
  return past;
}

/** Keeps a ref pointing at the latest value without re-running effects. */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/** Warms lazy chunks once the browser is idle after load. */
export function prefetchWhenIdle(loaders: Array<() => Promise<unknown>>): void {
  const run = () => loaders.forEach(load => { void load().catch(() => undefined); });
  const schedule = () => {
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(run, { timeout: 4000 });
    else window.setTimeout(run, 2500);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
