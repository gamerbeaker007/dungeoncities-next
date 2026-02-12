import monsterData from "@/data/monster-details.json";
import type { MonsterRecord, ResourceResult } from "@/types/resource";

const monsters = (monsterData.monsters ?? []) as MonsterRecord[];

const allResourceRows = buildAllResourceRows();
function toPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

function normalizeDropChance(dropChance: string | number | null | undefined) {
  if (dropChance === null || dropChance === undefined) {
    return null;
  }
  if (typeof dropChance === "number") {
    return String(dropChance);
  }
  const value = dropChance.trim();
  return value.length ? value : null;
}

export function getResourceSearchData(options: {
  queryParam?: string;
  pageParam?: string;
  pageSize?: number;
}) {
  return getResourceSearchDataFromRows(allResourceRows, options);
}

export function getAllResourceRows() {
  return allResourceRows;
}

export function getResourceSearchDataFromRows(
  rows: ResourceResult[],
  options: {
    queryParam?: string;
    pageParam?: string;
    pageSize?: number;
  },
) {
  const pageSize = options.pageSize ?? 24;
  const query = options.queryParam?.trim() ?? "";
  const normalized = query.toLowerCase();

  const filteredRows =
    normalized.length === 0
      ? rows
      : rows.filter((row) => {
          const searchFields = [
            row.resourceName,
            row.originalItemName ?? "",
            row.derivedItemName ?? "",
          ];

          return searchFields.some((field) =>
            field.toLowerCase().includes(normalized),
          );
        });

  const totalResults = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const currentPage = Math.min(toPositiveInt(options.pageParam, 1), totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedResults = filteredRows.slice(pageStart, pageStart + pageSize);

  return {
    query,
    totalResults,
    totalPages,
    currentPage,
    pagedResults,
    hasPrevPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

function buildAllResourceRows(): ResourceResult[] {
  const rows: ResourceResult[] = [];

  for (const monster of monsters) {
    const dungeonName =
      monster.firstEncounter?.dungeonName ?? "Unknown dungeon";
    const floorName = monster.firstEncounter?.floorName;
    const floorNumber = monster.firstEncounter?.floorNumber;
    const floorLabel =
      floorName ?? (floorNumber ? `Floor ${floorNumber}` : "Unknown floor");
    const location = `${dungeonName} / ${floorLabel}`;

    for (const [dropIndex, drop] of (monster.drops ?? []).entries()) {
      if (!drop.unlocked) {
        continue;
      }

      const originalItemName = (drop.itemName ?? "Unknown").trim();
      const hasPlaceholderName =
        Boolean(drop.itemNameWarning) || originalItemName === "???";
      const derivedItemName = (drop.derivedItemName ?? "").trim() || null;
      const resourceName =
        hasPlaceholderName && derivedItemName
          ? derivedItemName
          : originalItemName;

      rows.push({
        key: `${monster.monsterId}-${drop.itemId ?? "na"}-${resourceName}-${dropIndex}`,
        resourceName,
        originalItemName: originalItemName || null,
        derivedItemName: derivedItemName,
        nameWarning: hasPlaceholderName,
        resourceId: drop.itemId ?? null,
        itemImageUrl: drop.itemImageUrl ?? null,
        dropChance: normalizeDropChance(drop.dropChance),
        monsterImageUrl: monster.monsterImageUrl ?? null,
        monsterName: monster.monsterName,
        location,
      });
    }
  }

  return rows;
}
