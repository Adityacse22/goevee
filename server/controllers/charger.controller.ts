import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth.js';
import * as chargerService from '../services/charger.service.js';

type AuthenticatedRequest = Request & { user?: AuthUser };

export async function createChargerController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.status(201).json({ charger: await chargerService.createCharger(req.body, user) });
}

export async function getChargerController(req: Request, res: Response): Promise<void> {
  res.json({ charger: await chargerService.getCharger(String(req.params.chargerId)) });
}

export async function updateChargerStatusController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.json({
    charger: await chargerService.updateChargerStatus(String(req.params.chargerId), req.body, user),
  });
}

export async function listStationChargersController(req: Request, res: Response): Promise<void> {
  res.json({
    chargers: await chargerService.listChargersByStation(String(req.params.stationId)),
  });
}
