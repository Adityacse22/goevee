import { eq, sql, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { chargers, stations } from '../db/schema.js';
import type {
  CreateStationInput,
  UpdateStationInput,
} from '../validators/station.validator.js';

export type StationRecord = typeof stations.$inferSelect;

function stationInsertValues(input: CreateStationInput, operatorId?: string) {
  return {
    operatorId: input.operatorId ?? operatorId,
    name: input.name,
    address: input.address,
    city: input.city,
    state: input.state,
    country: input.country,
    pincode: input.pincode,
    latitude: String(input.latitude),
    longitude: String(input.longitude),
    status: input.status,
    openingTime: input.openingTime,
    closingTime: input.closingTime,
    pricingDetails: input.pricingDetails,
    amenities: input.amenities,
  };
}

export async function createStation(input: CreateStationInput, operatorId?: string) {
  const [station] = await db
    .insert(stations)
    .values(stationInsertValues(input, operatorId))
    .returning();

  return station;
}

export async function listStations() {
  return db.select().from(stations).orderBy(stations.name);
}

export async function findStationById(stationId: string) {
  const [station] = await db
    .select()
    .from(stations)
    .where(eq(stations.id, stationId))
    .limit(1);

  return station ?? null;
}

export async function findStationWithChargers(stationId: string) {
  const station = await findStationById(stationId);
  if (!station) return null;

  const stationChargers = await db
    .select()
    .from(chargers)
    .where(eq(chargers.stationId, stationId))
    .orderBy(chargers.chargerCode);

  return { ...station, chargers: stationChargers };
}

export async function listNearbyStations(lat: number, lng: number, radiusKm: number) {
  const distanceKm = sql<number>`(
    6371 * acos(
      least(1, greatest(-1,
        cos(radians(${lat})) *
        cos(radians(cast(${stations.latitude} as double precision))) *
        cos(radians(cast(${stations.longitude} as double precision)) - radians(${lng})) +
        sin(radians(${lat})) *
        sin(radians(cast(${stations.latitude} as double precision)))
      ))
    )
  )`;

  const nearbyStations = await db
    .select({
      station: stations,
      distanceKm,
    })
    .from(stations)
    .where(sql`${distanceKm} <= ${radiusKm}`)
    .orderBy(distanceKm);

  if (nearbyStations.length === 0) return [];

  const stationIds = nearbyStations.map(s => s.station.id);
  
  const stationChargers = await db
    .select()
    .from(chargers)
    .where(inArray(chargers.stationId, stationIds));

  return nearbyStations.map(s => ({
    station: {
      ...s.station,
      chargers: stationChargers.filter(c => c.stationId === s.station.id),
    },
    distanceKm: s.distanceKm,
  }));
}

export async function updateStation(stationId: string, input: UpdateStationInput) {
  const values: Partial<typeof stations.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.operatorId !== undefined) values.operatorId = input.operatorId;
  if (input.name !== undefined) values.name = input.name;
  if (input.address !== undefined) values.address = input.address;
  if (input.city !== undefined) values.city = input.city;
  if (input.state !== undefined) values.state = input.state;
  if (input.country !== undefined) values.country = input.country;
  if (input.pincode !== undefined) values.pincode = input.pincode;
  if (input.latitude !== undefined) values.latitude = String(input.latitude);
  if (input.longitude !== undefined) values.longitude = String(input.longitude);
  if (input.status !== undefined) values.status = input.status;
  if (input.openingTime !== undefined) values.openingTime = input.openingTime;
  if (input.closingTime !== undefined) values.closingTime = input.closingTime;
  if (input.pricingDetails !== undefined) values.pricingDetails = input.pricingDetails;
  if (input.amenities !== undefined) values.amenities = input.amenities;

  const [station] = await db
    .update(stations)
    .set(values)
    .where(eq(stations.id, stationId))
    .returning();

  return station ?? null;
}
