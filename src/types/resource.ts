export type ResourceResult = {
  key: string;
  resourceName: string;
  originalItemName: string;
  derivedItemName: string | null;
  nameWarning: boolean;
  resourceId: number;
  itemImageUrl: string;
  dropChance: number;
  minQuantity: number;
  maxQuantity: number;
  monsterImageUrl: string;
  monsterName: string;
  location: string;
  totalKills: number;
  totalEncounters: number;
};

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

export type MonsterRecord = {
  monsterId: number;
  monsterName: string;
  monsterType: string;
  monsterClass: string;
  monsterImageUrl: string;
  totalEncounters: number;
  totalKills: number;
  totalDefeats: number;
  totalBossEncounters: number;
  totalBossKills: number;
  totalBossDefeats: number;
  firstEncounter: {
    encounteredAt: string;
    dungeonId: string;
    dungeonName: string;
    floorName: string;
    floorNumber: number;
  };
  drops: ItemDrop[];
};
