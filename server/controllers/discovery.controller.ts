/**
 * Discovery HTTP layer. Responses always carry an explicit status so the client
 * can tell success, empty, partial, and failure apart. Precise coordinates,
 * queries, and addresses are never logged.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import type { DiscoveryErrorResponse, LatLng, RadiusKm } from '../../shared/discovery.js';
import { GOOGLE_PLACES_API_KEY, GOOGLE_PLACES_EV_FIELDS } from '../config/index.js';
import { createDiscoveryService, type DiscoveryService } from '../services/discovery/discovery.service.js';
import { DiscoveryError, discoveryError } from '../services/discovery/errors.js';
import { createGooglePlacesProvider } from '../services/discovery/google-places.provider.js';

let service: DiscoveryService | null = null;
const getService = () => {
  service ??= createDiscoveryService({
    provider: createGooglePlacesProvider({ apiKey: GOOGLE_PLACES_API_KEY, includeEvChargeOptions: GOOGLE_PLACES_EV_FIELDS }),
    log: message => console.warn(message),
  });
  return service;
};

/** Test seam: inject a service backed by a fake provider. */
export function setDiscoveryServiceForTests(next: DiscoveryService | null) {
  service = next;
}

function sendError(res: Response, error: unknown) {
  const failure = error instanceof DiscoveryError ? error : discoveryError('PROVIDER_UNAVAILABLE');
  if (!(error instanceof DiscoveryError)) console.error('[discovery] unexpected failure', error instanceof Error ? error.name : typeof error);
  const body: DiscoveryErrorResponse = { status: 'error', code: failure.code, message: failure.message, retryable: failure.retryable };
  res.status(failure.httpStatus).json(body);
}

/** Validation returning the discovery error shape (no echo of rejected values). */
export function validateDiscovery(schema: ZodTypeAny): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      const body: DiscoveryErrorResponse = {
        status: 'error',
        code: 'INVALID_REQUEST',
        message: `Invalid ${[...new Set(result.error.issues.map(issue => issue.path.slice(1).join('.') || issue.path.join('.')))].join(', ')}.`,
        retryable: false,
      };
      res.status(400).json(body);
      return;
    }
    res.locals.input = result.data;
    next();
  };
}

/** Aborts provider calls when the client disconnects (e.g. a superseded search). */
function clientSignal(req: Request, res: Response): AbortSignal {
  const controller = new AbortController();
  res.on('close', () => { if (!res.writableFinished) controller.abort(); });
  req.on('aborted', () => controller.abort());
  return controller.signal;
}

export const searchStationsController: RequestHandler = async (req, res) => {
  const { lat, lng, radiusKm } = res.locals.input.body as LatLng & { radiusKm: RadiusKm };
  try {
    res.json(await getService().searchStations({ lat, lng }, radiusKm, clientSignal(req, res)));
  } catch (error) {
    sendError(res, error);
  }
};

export const stationDetailsController: RequestHandler = async (req, res) => {
  try {
    res.json({ status: 'ok', station: await getService().stationDetails(res.locals.input.params.stationId, clientSignal(req, res)) });
  } catch (error) {
    sendError(res, error);
  }
};

export const autocompleteController: RequestHandler = async (req, res) => {
  const { input, sessionToken, bias, languageCode } = res.locals.input.body;
  try {
    res.json(await getService().autocomplete({ text: input, sessionToken, bias: bias ?? null, languageCode: languageCode ?? null }, clientSignal(req, res)));
  } catch (error) {
    sendError(res, error);
  }
};

export const resolveLocationController: RequestHandler = async (req, res) => {
  const { params, query } = res.locals.input;
  try {
    res.json({ status: 'ok', location: await getService().resolveLocation(params.placeId, query.sessionToken ?? null, clientSignal(req, res)) });
  } catch (error) {
    sendError(res, error);
  }
};

export const reverseGeocodeController: RequestHandler = async (req, res) => {
  try {
    res.json(await getService().reverseGeocode(res.locals.input.body, clientSignal(req, res)));
  } catch (error) {
    sendError(res, error);
  }
};
