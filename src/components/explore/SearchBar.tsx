/**
 * Explore location search — an ARIA 1.2 combobox backed by Places Autocomplete
 * (through /api/v1/discovery). Debounced 300 ms; one session token per
 * search-and-select; in-flight requests are aborted and stale responses
 * ignored. Enter picks the highlighted option, resolves a single match, or asks
 * the user to choose — never silently picks between ambiguous places.
 * Editing or clearing the text never relabels the results already shown;
 * only choosing a place (or the device location) changes the search centre.
 * On phones, focusing expands the same form full-screen (keyboard stays up).
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowLeft, LoaderCircle, LocateFixed, MapPin, Search, ShieldCheck, X } from 'lucide-react';
import { useExplore } from '@/controllers/useExplore';
import { autocompleteLocations, DiscoveryRequestError, newSessionToken, resolveLocation } from '@/lib/discovery/client';
import { t } from '@/lib/messages';
import type { LocationSuggestion } from '../../../shared/discovery';

export interface SearchBarHandle {
  focus: () => void;
}

interface Option {
  id: string;
  label: string;
  detail?: string | null;
  icon: ReactNode;
  action?: boolean;
  select: () => void;
}

type SuggestState =
  | { kind: 'idle' }
  | { kind: 'loading'; query: string }
  | { kind: 'ready'; query: string; suggestions: LocationSuggestion[] }
  | { kind: 'error'; query: string; message: string };

const LISTBOX_ID = 'explore-search-listbox';
const PHONE = '(max-width: 767.98px)';
const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

/** Makes everything outside `element` inert; returns a function that restores it. */
function inertOutside(element: HTMLElement): () => void {
  const touched: HTMLElement[] = [];
  let node: HTMLElement | null = element;
  while (node && node !== document.body) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) break;
    for (const sibling of Array.from(parent.children)) {
      if (sibling !== node && sibling instanceof HTMLElement && !sibling.inert) {
        sibling.inert = true;
        touched.push(sibling);
      }
    }
    node = parent;
  }
  return () => touched.forEach(item => { item.inert = false; });
}

export const SearchBar = forwardRef<SearchBarHandle>(function SearchBar(_props, ref) {
  const { searchCenter, chooseSearchCenter, centerLabel, requestDeviceLocation, locateState, dismissLocateMessage, deviceLocation } = useExplore();
  const committedText = searchCenter ? (searchCenter.source === 'place' ? searchCenter.label ?? '' : centerLabel ? capitalise(centerLabel) : '') : '';
  const [query, setQuery] = useState(committedText);
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggest, setSuggest] = useState<SuggestState>({ kind: 'idle' });
  const [resolving, setResolving] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const releaseRef = useRef<(() => void) | null>(null);
  const sessionRef = useRef<string>(newSessionToken());
  const requestSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const pendingEnter = useRef(false);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);
  // Reflect a newly committed centre in the field (not while the user is typing).
  useEffect(() => { setQuery(committedText); }, [committedText]);

  const release = useCallback(() => {
    releaseRef.current?.();
    releaseRef.current = null;
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.classList.remove('ge-search-open');
  }, []);
  useEffect(() => release, [release]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const expand = useCallback(() => {
    if (expanded) return;
    setExpanded(true);
    if (window.matchMedia(PHONE).matches && formRef.current) {
      releaseRef.current = inertOutside(formRef.current);
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.classList.add('ge-search-open');
    }
  }, [expanded]);

  const collapse = useCallback((blur = false) => {
    setExpanded(false);
    setActiveIndex(-1);
    release();
    if (blur && window.matchMedia(PHONE).matches) inputRef.current?.blur();
  }, [release]);

  const trimmed = query.trim();
  const typing = trimmed.length >= MIN_CHARS && query !== committedText;

  /** Fetches suggestions for `text`; only the latest request may update state. */
  const fetchSuggestions = useCallback((text: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const seq = ++requestSeq.current;
    setSuggest({ kind: 'loading', query: text });
    autocompleteLocations({ input: text, sessionToken: sessionRef.current, bias: deviceLocation?.coords ?? null }, controller.signal)
      .then(result => {
        if (seq !== requestSeq.current) return;
        setSuggest({ kind: 'ready', query: text, suggestions: result.suggestions });
      })
      .catch((error: unknown) => {
        if (seq !== requestSeq.current || (error instanceof DOMException && error.name === 'AbortError')) return;
        const code = error instanceof DiscoveryRequestError ? error.code : 'NETWORK';
        setSuggest({ kind: 'error', query: text, message: t.discovery.errors[code] });
      });
  }, [deviceLocation?.coords]);

  // Debounced autocomplete.
  useEffect(() => {
    if (!typing) {
      abortRef.current?.abort();
      requestSeq.current++;
      setSuggest({ kind: 'idle' });
      return undefined;
    }
    const timer = window.setTimeout(() => fetchSuggestions(trimmed), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [fetchSuggestions, trimmed, typing]);

  const choose = useCallback(async (suggestion: LocationSuggestion) => {
    setResolving(suggestion.primaryText);
    setNotice(null);
    try {
      const resolved = await resolveLocation(suggestion.placeId, sessionRef.current);
      chooseSearchCenter({
        source: 'place',
        label: suggestion.primaryText,
        secondaryLabel: suggestion.secondaryText,
        placeId: suggestion.placeId,
        coords: resolved.location,
      });
      setQuery(suggestion.primaryText);
      collapse(true);
    } catch (error) {
      const code = error instanceof DiscoveryRequestError ? error.code : 'NETWORK';
      setNotice(t.discovery.errors[code]);
    } finally {
      // The session ends with the details request; start a fresh one.
      sessionRef.current = newSessionToken();
      setResolving(null);
    }
  }, [chooseSearchCenter, collapse]);

  const useDevice = useCallback(() => {
    collapse(true);
    requestDeviceLocation();
  }, [collapse, requestDeviceLocation]);

  const currentSuggestions = useMemo(() => (suggest.kind === 'ready' && suggest.query === trimmed ? suggest.suggestions : []), [suggest, trimmed]);

  const options = useMemo<Option[]>(() => {
    const list: Option[] = [{
      id: 'current-location',
      label: t.discovery.useMyLocation,
      icon: <LocateFixed aria-hidden="true" strokeWidth={1.75} />,
      action: true,
      select: useDevice,
    }];
    if (typing) {
      for (const suggestion of currentSuggestions) {
        list.push({
          id: `place-${suggestion.placeId}`,
          label: suggestion.primaryText,
          detail: suggestion.secondaryText,
          icon: <MapPin aria-hidden="true" strokeWidth={1.75} />,
          select: () => { void choose(suggestion); },
        });
      }
    }
    return list;
  }, [choose, currentSuggestions, typing, useDevice]);

  useEffect(() => setActiveIndex(-1), [trimmed, suggest.kind]);
  const activeId = activeIndex >= 0 && options[activeIndex] ? `${LISTBOX_ID}-${options[activeIndex].id}` : undefined;
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  // Desktop panel: close on outside press.
  useEffect(() => {
    if (!expanded) return undefined;
    const onPointer = (event: PointerEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) collapse();
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [collapse, expanded]);

  /** Enter without a highlighted option: resolve one match, otherwise ask the user to choose. */
  const resolveEnter = useCallback((suggestions: LocationSuggestion[]) => {
    if (suggestions.length === 1) {
      void choose(suggestions[0]);
    } else if (suggestions.length > 1) {
      expand();
      setNotice(t.search.chooseOne(suggestions.length));
    } else {
      setNotice(t.search.noMatches(trimmed));
    }
  }, [choose, expand, trimmed]);

  // Complete a pending Enter once the suggestions for the typed text arrive.
  useEffect(() => {
    if (!pendingEnter.current || suggest.kind === 'loading' || suggest.kind === 'idle') return;
    if (suggest.query !== trimmed) return;
    pendingEnter.current = false;
    if (suggest.kind === 'error') { setNotice(suggest.message); return; }
    resolveEnter(suggest.suggestions);
  }, [resolveEnter, suggest, trimmed]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (expanded) {
        event.preventDefault();
        collapse();
      } else if (query) {
        setQuery('');
      }
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      expand();
      if (!options.length) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(index => (index + step + options.length) % options.length);
    }
  };

  const onSubmit = () => {
    setNotice(null);
    const highlighted = options[activeIndex];
    if (highlighted) { highlighted.select(); return; }
    if (!typing) return;
    if (suggest.kind === 'ready' && suggest.query === trimmed) { resolveEnter(suggest.suggestions); return; }
    // Suggestions not loaded yet for this text: fetch now and finish when they land.
    pendingEnter.current = true;
    if (!(suggest.kind === 'loading' && suggest.query === trimmed)) fetchSuggestions(trimmed);
  };

  const clear = () => {
    // Clearing the text does not change the search centre or relabel results.
    setQuery('');
    setNotice(null);
    expand();
    inputRef.current?.focus();
  };

  const loading = typing && (suggest.kind === 'loading' || (suggest.kind === 'idle'));
  const noMatches = typing && suggest.kind === 'ready' && suggest.query === trimmed && suggest.suggestions.length === 0;
  const suggestError = typing && suggest.kind === 'error' && suggest.query === trimmed ? suggest.message : null;
  const locateMessage = locateState !== 'idle' && locateState !== 'locating' ? t.discovery.locate[locateState] : null;
  const canRetryLocate = locateState === 'timeout' || locateState === 'unavailable';

  return (
    <div className="ge-search-slot">
      <form
        ref={formRef}
        role="search"
        className="ge-search"
        data-expanded={expanded}
        aria-label={t.search.label}
        onSubmit={event => {
          event.preventDefault();
          onSubmit();
        }}
        onBlur={event => {
          if (!window.matchMedia(PHONE).matches && !event.currentTarget.contains(event.relatedTarget as Node | null)) collapse();
        }}
      >
        <div className="ge-search__row">
          {expanded ? (
            <button type="button" className="ge-search__back ge-press md:hidden" aria-label={t.search.closeSearch} onClick={() => collapse(true)}>
              <ArrowLeft aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
            </button>
          ) : null}
          <span className={`ge-search__lead ${expanded ? 'max-md:hidden' : ''}`} aria-hidden="true">
            {loading || resolving ? <LoaderCircle className="animate-spin" strokeWidth={1.75} /> : <Search strokeWidth={1.75} />}
          </span>
          <label htmlFor="explore-search" className="ge-sr-only">{t.search.label}</label>
          <input
            ref={inputRef}
            id="explore-search"
            className="ge-search__input"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={120}
            placeholder={t.search.placeholder}
            value={query}
            role="combobox"
            aria-expanded={expanded}
            aria-controls={LISTBOX_ID}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            aria-busy={loading || Boolean(resolving)}
            onFocus={expand}
            onClick={expand}
            onChange={event => {
              setQuery(event.target.value);
              setNotice(null);
              pendingEnter.current = false;
              expand();
            }}
            onKeyDown={onKeyDown}
          />
          {query && (
            <button type="button" className="ge-search__clear ge-press" aria-label={t.search.clear} onClick={clear}>
              <X aria-hidden="true" strokeWidth={1.75} />
            </button>
          )}
          <span className="ge-search__divider" aria-hidden="true" />
          <button
            type="button"
            className="ge-locate ge-press"
            data-state={locateState === 'locating' ? 'locating' : locateMessage ? 'denied' : 'idle'}
            aria-describedby="explore-location-notice"
            aria-disabled={locateState === 'locating'}
            onClick={() => { if (locateState !== 'locating') requestDeviceLocation(); }}
          >
            {locateState === 'locating' ? <LoaderCircle aria-hidden="true" strokeWidth={1.75} /> : <LocateFixed aria-hidden="true" strokeWidth={1.75} />}
            {/* The visible two-line text is the accessible name ("Use current location"). */}
            <span className="ge-locate__label">
              {locateState === 'locating' ? <span>{t.search.locating}</span> : <><span>{t.search.useLocationTop}</span>{' '}<span>{t.search.useLocationBottom}</span></>}
            </span>
          </button>
          <span id="explore-location-notice" className="ge-sr-only">{t.search.locationNotice}</span>
        </div>

        <div className="ge-search__panel">
          {!typing && (
            <p className="ge-search__notice">
              <ShieldCheck aria-hidden="true" strokeWidth={1.75} />
              <span>{t.search.locationNotice}</span>
            </p>
          )}
          <div id={LISTBOX_ID} role="listbox" aria-label={t.search.label}>
            {options.map((option, index) => (
              <div
                key={option.id}
                id={`${LISTBOX_ID}-${option.id}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`ge-option ${option.action ? 'ge-option--action' : ''}`}
                onPointerDown={event => event.preventDefault()}
                onClick={option.select}
                onMouseMove={() => setActiveIndex(index)}
              >
                <span className="ge-option__icon" aria-hidden="true">{option.icon}</span>
                <span className="ge-option__text">
                  <span className="ge-option__label">{option.label}</span>
                  {option.detail && <span className="ge-option__detail">{option.detail}</span>}
                </span>
              </div>
            ))}
          </div>
          <div role="status" aria-live="polite">
            {loading && <p className="ge-search__empty">{t.search.loadingSuggestions}</p>}
            {resolving && <p className="ge-search__empty">{t.search.resolving(resolving)}</p>}
            {noMatches && !notice && <p className="ge-search__empty">{t.search.noMatches(trimmed)}</p>}
            {suggestError && <p className="ge-search__empty">{suggestError}</p>}
            {notice && <p className="ge-search__empty">{notice}</p>}
          </div>
          <p className="ge-search__attribution">{t.search.poweredBy}</p>
        </div>
      </form>

      {locateMessage && (
        <div className="ge-search__message" role="status" data-locate={locateState}>
          <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none text-ink-600" strokeWidth={1.75} />
          <span className="flex-1">
            {locateMessage}
            {canRetryLocate && <>{' '}<button type="button" onClick={requestDeviceLocation}>{t.search.retry}</button></>}
          </span>
          <button type="button" aria-label={t.search.dismiss} onClick={dismissLocateMessage} className="grid h-11 w-11 place-items-center !no-underline">
            <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      )}
    </div>
  );
});

function capitalise(text: string): string {
  return text ? text[0].toLocaleUpperCase() + text.slice(1) : text;
}
