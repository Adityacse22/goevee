import type { DiscoveryErrorCode } from '../../../shared/discovery.js';

/** Failure surfaced to the client with a stable code. Messages never echo coordinates, queries, or keys. */
export class DiscoveryError extends Error {
  readonly code: DiscoveryErrorCode;
  readonly httpStatus: number;
  readonly retryable: boolean;
  constructor(code: DiscoveryErrorCode, message: string) {
    super(message);
    this.name = 'DiscoveryError';
    this.code = code;
    this.httpStatus = HTTP_STATUS[code];
    this.retryable = RETRYABLE.has(code);
  }
}

const HTTP_STATUS: Record<DiscoveryErrorCode, number> = {
  INVALID_REQUEST: 400,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  PROVIDER_TIMEOUT: 504,
  PROVIDER_QUOTA: 503,
  PROVIDER_CONFIG: 503,
  PROVIDER_UNAVAILABLE: 502,
};

const RETRYABLE = new Set<DiscoveryErrorCode>(['RATE_LIMITED', 'PROVIDER_TIMEOUT', 'PROVIDER_QUOTA', 'PROVIDER_UNAVAILABLE']);

export const MESSAGES: Record<DiscoveryErrorCode, string> = {
  INVALID_REQUEST: 'The search request was not valid.',
  NOT_FOUND: 'That place was not found.',
  RATE_LIMITED: 'Too many searches. Please wait a moment and try again.',
  PROVIDER_TIMEOUT: 'The charger data provider did not respond in time.',
  PROVIDER_QUOTA: 'The charger data provider is over its usage limit right now.',
  PROVIDER_CONFIG: 'Charger search is not configured correctly on the server.',
  PROVIDER_UNAVAILABLE: 'The charger data provider is unavailable right now.',
};

export const discoveryError = (code: DiscoveryErrorCode) => new DiscoveryError(code, MESSAGES[code]);
