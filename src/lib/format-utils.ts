import type { MonsterRecord } from "@/types/resource";

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
