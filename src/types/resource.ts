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
