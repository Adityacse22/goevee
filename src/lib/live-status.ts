/**
 * GoEvee — live connector status adapter.
 * Transports share one interface so the mock feed can be swapped for the
 * aggregator's SSE stream. SSE reconnects with exponential backoff and, after
 * repeated failures, falls back to polling every 30 s while the tab is visible.
 */
import type { EvseStatus, LiveConnectionState, Station } from './types';

export type LiveEvent =
  | { type: 'connector'; stationId: string; connectorId: string; status: EvseStatus; at: string }
  | { type: 'heartbeat'; stationIds: string[]; at: string };

export interface LiveHandlers {
  onEvent: (event: LiveEvent) => void;
  onState: (state: LiveConnectionState) => void;
}

export interface LiveTransport {
  /** Starts the transport and returns a stop function. */
  start: (handlers: LiveHandlers) => () => void;
}

const isLiveEvent = (value: unknown): value is LiveEvent => {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<LiveEvent>;
  return event.type === 'connector' || event.type === 'heartbeat';
};

/** Exponential backoff with full jitter, capped at 30 s. */
export function backoffDelay(attempt: number, random: () => number = Math.random): number {
  const ceiling = Math.min(30_000, 1_000 * 2 ** attempt);
  return Math.round(ceiling / 2 + random() * (ceiling / 2));
}

/** Polls a snapshot endpoint, only while the page is visible and online. */
export function createPollingTransport(
  poll: () => Promise<LiveEvent[]>,
  intervalMs = 30_000,
): LiveTransport {
  return {
    start({ onEvent, onState }) {
      let timer: number | undefined;
      let stopped = false;
      const schedule = () => {
        window.clearTimeout(timer);
        if (stopped || document.visibilityState !== 'visible' || !navigator.onLine) {
          onState('paused');
          return;
        }
        onState('polling');
        timer = window.setTimeout(async () => {
          try {
            (await poll()).forEach(onEvent);
          } catch {
            // Keep the last good status on screen; the next poll retries.
          }
          schedule();
        }, intervalMs);
      };
      const resume = () => schedule();
      document.addEventListener('visibilitychange', resume);
      window.addEventListener('online', resume);
      window.addEventListener('offline', resume);
      schedule();
      return () => {
        stopped = true;
        window.clearTimeout(timer);
        document.removeEventListener('visibilitychange', resume);
        window.removeEventListener('online', resume);
        window.removeEventListener('offline', resume);
      };
    },
  };
}

/** Server-Sent Events with backoff; hands over to `fallback` after `failuresBeforeFallback` errors. */
export function createSseTransport(url: string, fallback?: LiveTransport, failuresBeforeFallback = 3): LiveTransport {
  return {
    start(handlers) {
      let source: EventSource | null = null;
      let retryTimer: number | undefined;
      let failures = 0;
      let stopped = false;
      let stopFallback: (() => void) | null = null;

      const connect = () => {
        if (stopped) return;
        handlers.onState(failures === 0 ? 'connecting' : 'reconnecting');
        source = new EventSource(url);
        source.onopen = () => {
          failures = 0;
          stopFallback?.();
          stopFallback = null;
          handlers.onState('live');
        };
        source.onmessage = message => {
          try {
            const parsed: unknown = JSON.parse(message.data);
            const events = Array.isArray(parsed) ? parsed : [parsed];
            events.filter(isLiveEvent).forEach(handlers.onEvent);
          } catch {
            // Ignore malformed frames rather than dropping the stream.
          }
        };
        source.onerror = () => {
          source?.close();
          source = null;
          failures += 1;
          if (fallback && failures >= failuresBeforeFallback && !stopFallback) {
            stopFallback = fallback.start(handlers);
          }
          retryTimer = window.setTimeout(connect, backoffDelay(failures));
        };
      };

      connect();
      return () => {
        stopped = true;
        window.clearTimeout(retryTimer);
        source?.close();
        stopFallback?.();
      };
    },
  };
}

interface MockOptions {
  /** Current station data, read at each tick. */
  getStations: () => Station[];
  heartbeatMs?: number;
  /** Range for the next simulated status change, in ms. */
  changeEveryMs?: [number, number];
  random?: () => number;
}

/**
 * Simulated aggregator feed for development and demos. Real-time stations get
 * heartbeats; occasionally one connector flips between free and in use, never
 * taking the last free connector so demo cards stay meaningful.
 */
export function createMockTransport({
  getStations,
  heartbeatMs = 30_000,
  changeEveryMs = [35_000, 65_000],
  random = Math.random,
}: MockOptions): LiveTransport {
  return {
    start({ onEvent, onState }) {
      let changeTimer: number | undefined;
      const realtimeIds = () =>
        getStations()
          .filter(station => station.supportsRealtime && Date.now() - Date.parse(station.lastUpdated) < 120_000)
          .map(station => station.id);

      const running = () => navigator.onLine;
      const heartbeat = () => {
        if (running()) onEvent({ type: 'heartbeat', stationIds: realtimeIds(), at: new Date().toISOString() });
      };
      const scheduleChange = () => {
        const [min, max] = changeEveryMs;
        changeTimer = window.setTimeout(() => {
          if (running()) {
            const ids = new Set(realtimeIds());
            const candidates = getStations().filter(station => ids.has(station.id));
            const station = candidates[Math.floor(random() * candidates.length)];
            if (station) {
              const free = station.connectors.filter(connector => connector.status === 'AVAILABLE').length;
              const flippable = station.connectors.filter(connector =>
                connector.status === 'CHARGING' || (connector.status === 'AVAILABLE' && free > 1));
              const connector = flippable[Math.floor(random() * flippable.length)];
              if (connector) {
                onEvent({
                  type: 'connector',
                  stationId: station.id,
                  connectorId: connector.id,
                  status: connector.status === 'AVAILABLE' ? 'CHARGING' : 'AVAILABLE',
                  at: new Date().toISOString(),
                });
              }
            }
          }
          scheduleChange();
        }, min + random() * (max - min));
      };
      const reportState = () => onState(running() ? 'live' : 'paused');

      onState('connecting');
      const openTimer = window.setTimeout(() => {
        reportState();
        heartbeat();
      }, 400);
      const heartbeatTimer = window.setInterval(heartbeat, heartbeatMs);
      scheduleChange();
      window.addEventListener('online', reportState);
      window.addEventListener('offline', reportState);
      return () => {
        window.clearTimeout(openTimer);
        window.clearInterval(heartbeatTimer);
        window.clearTimeout(changeTimer);
        window.removeEventListener('online', reportState);
        window.removeEventListener('offline', reportState);
      };
    },
  };
}

/** Applies one live event to station data immutably. */
export function applyLiveEvent(stations: Station[], event: LiveEvent): Station[] {
  if (event.type === 'heartbeat') {
    const ids = new Set(event.stationIds);
    return stations.map(station => (ids.has(station.id) ? { ...station, lastUpdated: event.at } : station));
  }
  return stations.map(station => {
    if (station.id !== event.stationId) return station;
    return {
      ...station,
      lastUpdated: event.at,
      connectors: station.connectors.map(connector =>
        connector.id === event.connectorId ? { ...connector, status: event.status } : connector),
    };
  });
}
