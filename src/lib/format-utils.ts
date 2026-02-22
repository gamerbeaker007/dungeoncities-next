import { FloorInfo, MonsterRecord } from "@/types/monter";

export function formatDropQty(
  minQuantity: number | null | undefined,
  maxQuantity: number | null | undefined,
): string {
  if (minQuantity === null || minQuantity === undefined) {
    return "Unknown";
  }

  if (maxQuantity === null || maxQuantity === undefined) {
    return "Unknown";
  }

  return minQuantity === maxQuantity
    ? `${minQuantity}`
    : `${minQuantity}-${maxQuantity}`;
}

export function toPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return parsed;
}

export function formatMonsterLocation(
  firstEncounter: MonsterRecord["firstEncounter"] | null | undefined,
): string {
  const dungeonName = firstEncounter?.dungeonName ?? "Unknown dungeon";
  const floorName = firstEncounter?.floorName;
  const floorNumber = firstEncounter?.floorNumber;
  const floorLabel =
    floorName ?? (floorNumber ? `Floor ${floorNumber}` : "Unknown floor");
  return `${dungeonName} / ${floorLabel}`;
}

/**
 * Format location from a community floor record (used when firstEncounter is not available).
 */
export function formatFloorLocation(
  floor: FloorInfo | null | undefined,
): string {
  if (!floor) return "Unknown location";
  const floorLabel =
    floor.name ??
    (floor.floorNumber ? `Floor ${floor.floorNumber}` : "Unknown floor");
  return floorLabel;
}

/**
 * Format location from a MonsterRecord, preferring firstEncounter (personal)
 * over floor (community).
 */
export function formatMonsterLocationFromRecord(
  monster: MonsterRecord,
): string {
  if (monster.firstEncounter) {
    return formatMonsterLocation(monster.firstEncounter);
  }
  return formatFloorLocation(monster.floor);
}
