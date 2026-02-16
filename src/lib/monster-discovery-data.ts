import type { ItemDrop, MonsterRecord } from "@/types/monter";
import { getMonsters, getTotalMonstersInGame } from "./monster-data";

const monsters = getMonsters();
const totalMonstersInGame = getTotalMonstersInGame();

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
  // Remove dummy items TODO remove this very hacky
  const drops = monster.drops.filter((drop) => {
    return !drop.itemImageUrl.includes("items/Weapon");
  });

  const identifiedDrops = drops.filter((d) => isDropIdentified(d));
  const unidentifiedDropCount = drops.length - identifiedDrops.length;

  const discovered = identifiedDrops.length > 0;
  const fullyDiscovered = discovered && unidentifiedDropCount === 0;

  return {
    ...monster,
    drops,
    unidentifiedDropCount,
    discovered,
    fullyDiscovered,
  };
}

export function getMonsterDiscoveryList(): MonsterDiscoveryListItem[] {
  return monsters.map(mapMonsterToDiscoveryItem);
}
