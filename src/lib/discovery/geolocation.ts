/**
 * Device location. Asked for only after an explicit user action, or silently
 * when the Permissions API already reports "granted". Never substitutes a
 * default city or IP-derived position.
 *
 * Freshness policy: a cached fix up to 60 s old is accepted (maximumAge), the
 * request times out after 10 s, and low-power positioning is used — city-scale
 * accuracy is enough for a ≥ 10 km search. Fixes worse than 2 km are flagged
 * as imprecise so the UI can say so.
 */
import type { LatLng } from '../../../shared/discovery';

export const LOCATION_TIMEOUT_MS = 10_000;
export const LOCATION_MAX_AGE_MS = 60_000;
export const IMPRECISE_ACCURACY_M = 2_000;

export interface DeviceLocation {
  coords: LatLng;
  /** 95 % confidence radius in metres, as reported by the browser. */
  accuracyM: number | null;
  /** When the browser produced the fix (ms since epoch). */
  timestamp: number;
}

export type LocationErrorKind = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'insecure';

export class LocationError extends Error {
  readonly kind: LocationErrorKind;
  constructor(kind: LocationErrorKind) {
    super(kind);
    this.name = 'LocationError';
    this.kind = kind;
  }
}

export type PermissionStateLike = 'granted' | 'denied' | 'prompt' | 'unknown';

export function geolocationSupport(): 'ok' | 'unsupported' | 'insecure' {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('geolocation' in navigator)) return 'unsupported';
  if (window.isSecureContext === false) return 'insecure';
  return 'ok';
}

/** Reads the geolocation permission without prompting; 'unknown' when the Permissions API is absent. */
export async function geolocationPermission(): Promise<PermissionStateLike> {
  try {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return 'unknown';
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return status.state === 'granted' || status.state === 'denied' || status.state === 'prompt' ? status.state : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function getDeviceLocation(): Promise<DeviceLocation> {
  const support = geolocationSupport();
  if (support !== 'ok') return Promise.reject(new LocationError(support));
  return new Promise((resolve, reject) => {
    // Some browsers never call back when a prompt is ignored; enforce our own ceiling too.
    const guard = window.setTimeout(() => reject(new LocationError('timeout')), LOCATION_TIMEOUT_MS + 2_000);
    navigator.geolocation.getCurrentPosition(
      position => {
        window.clearTimeout(guard);
        const { latitude, longitude, accuracy } = position.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
          reject(new LocationError('unavailable'));
          return;
        }
        resolve({
          coords: { lat: latitude, lng: longitude },
          accuracyM: Number.isFinite(accuracy) ? accuracy : null,
          timestamp: Number.isFinite(position.timestamp) ? position.timestamp : Date.now(),
        });
      },
      error => {
        window.clearTimeout(guard);
        reject(new LocationError(error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'unavailable'));
      },
      { enableHighAccuracy: false, timeout: LOCATION_TIMEOUT_MS, maximumAge: LOCATION_MAX_AGE_MS },
    );
  });
}

export const isImprecise = (location: DeviceLocation | null) => location?.accuracyM != null && location.accuracyM > IMPRECISE_ACCURACY_M;
