export type ItemDrop = {
  itemId: number;
  itemName: string;
  derivedItemName: string | null;
  itemNameWarning: boolean;
  itemClass: string;
  itemImageUrl: string;
  dropChance: number;
  minQuantity: number;
  maxQuantity: number;
  bossDrop: boolean;
  unlocked: boolean;
};

/** Floor info stored in the community combined JSON */
export type FloorInfo = {
  floorId: number;
  name: string;
  floorNumber?: number;
  class?: string;
};

/**
 * Unified monster record supporting both community (combined) and personal views.
 * Personal stats are optional — only present when a player has synced their data.
 */
export type MonsterRecord = {
  monsterId: number;
  monsterName: string;
  monsterType: string;
  monsterClass: string;
  monsterImageUrl: string;
  /** Floor info from the community combined JSON */
  floor?: FloorInfo;
  drops: ItemDrop[];
  // ----- Personal stats (present only in player-synced data) -----
  totalEncounters?: number;
  totalKills?: number;
  totalDefeats?: number;
  totalBossEncounters?: number;
  totalBossKills?: number;
  totalBossDefeats?: number;
  firstEncounter?: {
    encounteredAt: string;
    dungeonId: string;
    dungeonName: string;
    floorName: string;
    floorNumber: number;
  };
};

/**
 * Unified shape for both the community Supabase JSON and personal localStorage data.
 */
export type MonsterDexData = {
  lastUpdated: string;
  totalDiscoveries: number;
  /** Total monsters in the game (from the dex API). */
  totalMonsters: number;
  monsters: MonsterRecord[];
};

/**
 * Progress events streamed from runFullSyncAction.
 * Each event is a JSON line written to the ReadableStream.
 */
export type SyncProgressEvent =
  | { type: "init"; total: number }
  | { type: "progress"; fetched: number; total: number; failed: number }
  | { type: "committing" }
  | {
      type: "done";
      monsters: MonsterRecord[];
      lastUpdated: string;
      totalDiscoveries: number;
      totalMonsters: number;
      communityUpdated: boolean;
      totalFailed: number;
      /** Set when Supabase was unreachable — personal data is still saved locally. */
      communityError?: string;
    }
  | { type: "error"; error: string };
