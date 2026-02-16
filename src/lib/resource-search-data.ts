import type { ResourceResult } from "@/types/resource";
import { toNumber, toPositiveInt } from "./format-utils";
import { getMonsters } from "./monster-data";

const monsters = getMonsters();
const allResourceRows = buildAllResourceRows();

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
          // If query is a number, search by ID
          const queryAsNumber = Number(normalized);
          if (Number.isInteger(queryAsNumber) && queryAsNumber > 0) {
            return row.resourceId === queryAsNumber;
          }

          // Otherwise search by name
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
    const dungeonName = monster.firstEncounter.dungeonName ?? "Unknown dungeon";
    const floorName = monster.firstEncounter.floorName;
    const floorNumber = monster.firstEncounter.floorNumber;
    const floorLabel =
      floorName ?? (floorNumber ? `Floor ${floorNumber}` : "Unknown floor");
    const location = `${dungeonName} / ${floorLabel}`;

    for (const [dropIndex, drop] of (monster.drops ?? []).entries()) {
      if (!drop.unlocked) {
        continue;
      }

      // Remove dummy items TODO remove this very hacky
      if (drop.itemImageUrl.includes("items/Weapon")) {
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
        originalItemName: originalItemName,
        derivedItemName: derivedItemName,
        nameWarning: hasPlaceholderName,
        resourceId: drop.itemId,
        itemImageUrl: drop.itemImageUrl,
        dropChance: toNumber(drop.dropChance),
        minQuantity: toNumber(drop.minQuantity),
        maxQuantity: toNumber(drop.maxQuantity),
        monsterImageUrl: monster.monsterImageUrl ?? "",
        monsterName: monster.monsterName,
        location,
        totalKills: monster.totalKills ?? 0,
        totalEncounters: monster.totalEncounters ?? 0,
      });
    }
  }

  return rows;
}
