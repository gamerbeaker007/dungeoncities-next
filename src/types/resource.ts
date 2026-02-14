export type ResourceResult = {
  key: string;
  resourceName: string;
  originalItemName: string | null;
  derivedItemName: string | null;
  nameWarning: boolean;
  resourceId: number | null;
  itemImageUrl: string | null;
  dropChance: string | null;
  monsterImageUrl: string | null;
  monsterName: string;
  location: string;
  totalKills: number;
  totalEncounters: number;
};

export type MonsterRecord = {
  monsterId: number;
  monsterName: string;
  monsterImageUrl?: string | null;
  totalEncounters?: number;
  totalKills?: number;
  totalDefeats?: number;
  totalBossEncounters?: number;
  totalBossKills?: number;
  totalBossDefeats?: number;
  firstEncounter?: {
    dungeonName?: string | null;
    floorName?: string | null;
    floorNumber?: number | null;
  };
  drops?: Array<{
    itemId?: number | null;
    itemName?: string | null;
    derivedItemName?: string | null;
    itemNameWarning?: boolean;
    itemImageUrl?: string | null;
    dropChance?: string | number | null;
    unlocked?: boolean;
  }>;
};
