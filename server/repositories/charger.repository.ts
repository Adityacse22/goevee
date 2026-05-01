import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { chargers } from '../db/schema.js';
import type {
  CreateChargerInput,
  UpdateChargerStatusInput,
} from '../validators/charger.validator.js';

export type ChargerRecord = typeof chargers.$inferSelect;

export async function createCharger(input: CreateChargerInput) {
  const [charger] = await db
    .insert(chargers)
    .values({
      stationId: input.stationId,
      chargerCode: input.chargerCode,
      connectorType: input.connectorType,
      powerOutputKw: String(input.powerOutputKw),
      currentType: input.currentType,
      status: input.status ?? 'AVAILABLE',
    })
    .returning();

  return charger;
}

export async function findChargerById(chargerId: string) {
  const [charger] = await db
    .select()
    .from(chargers)
    .where(eq(chargers.id, chargerId))
    .limit(1);

  return charger ?? null;
}

export async function listChargersByStation(stationId: string) {
  return db
    .select()
    .from(chargers)
    .where(eq(chargers.stationId, stationId))
    .orderBy(chargers.chargerCode);
}

export async function updateChargerStatus(
  chargerId: string,
  input: UpdateChargerStatusInput,
) {
  const [charger] = await db
    .update(chargers)
    .set({
      status: input.status,
      estimatedAvailableAt: input.estimatedAvailableAt
        ? new Date(input.estimatedAvailableAt)
        : undefined,
      updatedAt: new Date(),
    })
    .where(eq(chargers.id, chargerId))
    .returning();

  return charger ?? null;
}
