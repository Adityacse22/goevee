import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth.js';
import * as stationService from '../services/station.service.js';

type AuthenticatedRequest = Request & { user?: AuthUser };

export async function createStationController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.status(201).json({ station: await stationService.createStation(req.body, user) });
}

export async function listStationsController(_req: Request, res: Response): Promise<void> {
  res.json({ stations: await stationService.listStations() });
}

export async function nearbyStationsController(req: Request, res: Response): Promise<void> {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Number(req.query.radiusKm);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    res.status(400).json({ error: 'Invalid coordinates' });
    return;
  }

  const stations = await stationService.listNearbyStations(lat, lng, radiusKm || 10);
  res.json({ stations });
}

export async function getStationController(req: Request, res: Response): Promise<void> {
  res.json({ station: await stationService.getStation(String(req.params.stationId)) });
}

export async function updateStationController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.json({
    station: await stationService.updateStation(String(req.params.stationId), req.body, user),
  });
}
