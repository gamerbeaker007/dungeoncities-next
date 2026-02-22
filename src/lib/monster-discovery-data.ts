import type { ItemDrop, MonsterRecord } from "@/types/monter";

export type MonsterDiscoveryListItem = Omit<
  MonsterRecord,
  | "totalEncounters"
  | "totalKills"
  | "totalDefeats"
  | "totalBossEncounters"
  | "totalBossKills"
  | "totalBossDefeats"
> & {
  // Personal stats are always present in list items (defaulting to 0 when no personal data)
  totalEncounters: number;
  totalKills: number;
  totalDefeats: number;
  totalBossEncounters: number;
  totalBossKills: number;
  totalBossDefeats: number;
  unidentifiedDropCount: number;
  /** True when the player has encountered this monster at least once (totalEncounters > 0) */
  encountered: boolean;
  /** True when at least one drop has been identified */
  discovered: boolean;
  /** True when all drops have been identified */
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

  const totalEncounters = monster.totalEncounters ?? 0;

  return {
    ...monster,
    drops,
    // Merge personal stats (defaults to 0 when no personal data)
    totalEncounters,
    totalKills: monster.totalKills ?? 0,
    totalDefeats: monster.totalDefeats ?? 0,
    totalBossEncounters: monster.totalBossEncounters ?? 0,
    totalBossKills: monster.totalBossKills ?? 0,
    totalBossDefeats: monster.totalBossDefeats ?? 0,
    firstEncounter: monster.firstEncounter,
    unidentifiedDropCount,
    encountered: totalEncounters > 0,
    discovered,
    fullyDiscovered,
  };
}

/**
 * Build a discovery list from an explicit set of community monster records.
 * Used by client components that have loaded fresh data from Supabase.
 * When personal stats are provided, they are merged in.
 */
export function buildDiscoveryListFromRecords(
  monsterRecords: MonsterRecord[],
): MonsterDiscoveryListItem[] {
  return monsterRecords.map((monster) => mapMonsterToDiscoveryItem(monster));
}
