import monsterData from "@/data/monster-details.json";
import type { ItemDrop, MonsterRecord, ResourceResult } from "@/types/resource";
import { toNumber, toPositiveInt } from "./format-utils";

const monsters = (monsterData.monsters ?? []) as MonsterRecord[];
const totalMonstersInGame = monsterData.totalMonsters ?? 0;

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

export function getMonsterDiscoveryStats() {
  const discoveryList = getMonsterDiscoveryList();
  const totalCountEncountered = discoveryList.filter(
    (monster) => monster.totalEncounters > 0,
  ).length;
  const totalDiscoveredCount = discoveryList.filter(
    (monster) => monster.discovered,
  ).length;
  const fullyDiscoveredCount = discoveryList.filter(
    (monster) => monster.fullyDiscovered,
  ).length;

  const totalEncounteredPercentage =
    totalMonstersInGame > 0
      ? Math.round((totalCountEncountered / totalMonstersInGame) * 100)
      : 0;

  const totalDiscoveredPercentage =
    totalMonstersInGame > 0
      ? Math.round((totalDiscoveredCount / totalMonstersInGame) * 100)
      : 0;

  const fullyPercentage =
    totalDiscoveredCount > 0
      ? Math.round((fullyDiscoveredCount / totalDiscoveredCount) * 100)
      : 0;

  return {
    totalMonstersInGame,
    totalCountEncountered,
    totalEncounteredPercentage,
    totalDiscoveredCount,
    totalDiscoveredPercentage,
    fullyDiscoveredCount,
    fullyPercentage,
  };
}

export type MonsterDiscoveryListItem = MonsterRecord & {
  unidentifiedDropCount: number;
  discovered: boolean;
  fullyDiscovered: boolean;
};

function isDropIdentified(drop: ItemDrop): boolean {
  return drop.unlocked && !Boolean(drop.itemNameWarning) && drop.dropChance > 0;
}

function mapMonsterToDiscoveryItem(
  monster: MonsterRecord,
): MonsterDiscoveryListItem {
  const drops = monster.drops;

  const identifiedDrops = drops.filter((d) => isDropIdentified(d));
  const unidentifiedDropCount = drops.length - identifiedDrops.length;
  if (unidentifiedDropCount === 0) {
    console.log(`Monster ${monster.monsterName} has all drops identified.`);
  }
  const discovered = identifiedDrops.length > 0;
  const fullyDiscovered = discovered && unidentifiedDropCount === 0;

  return {
    ...monster,
    unidentifiedDropCount,
    discovered,
    fullyDiscovered,
  };
}

export function getMonsterDiscoveryList(): MonsterDiscoveryListItem[] {
  return monsters.map(mapMonsterToDiscoveryItem);
}
