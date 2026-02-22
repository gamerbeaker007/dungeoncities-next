export type DCDexDiscovery = {
  monsterId: number;
};

export type DCDexDiscoveryStats = {
  totalDiscovered: number;
  regularDiscovered: number | string;
  bossDiscovered: number | string;
  completionPercentage: number;
  totalKills: number | string;
  totalBossKills: number | string;
};

export type DCDexResponse = {
  success: boolean;
  data: {
    discoveries: DCDexDiscovery[];
    stats: DCDexDiscoveryStats;
    totalMonstersInGame: number;
  };
};

export type DCMonsterDropItem = {
  itemId: number;
  name?: string | null;
  class: string;
  imageUrl: string;
};

export type DCMonsterDrop = {
  id: string;
  monsterDropId: number;
  monsterId: number;
  itemId: number;
  dropChance: string;
  minQuantity: string;
  maxQuantity: string;
  createdAt: string;
  updatedAt: string;
  bossDrop: boolean;
  item?: DCMonsterDropItem | null;
  unlocked: boolean;
};

export type DCDungeonInfo = {
  dungeonId: number;
  name: string;
  totalFloors: number;
};

export type DCFloorInfo = {
  floorId: number;
  name: string;
  floorNumber?: number;
  class?: string;
};

export type DCMonster = {
  monsterId: number;
  name: string;
  type: string;
  class: string;
  minHp: number;
  maxHp: number;
  minAttack: number;
  maxAttack: number;
  minDefense: number;
  maxDefense: number;
  stamina: number;
  experienceReward: number;
  imageUrl: string;
};

export type DCLore = {
  id: string;
  loreId: number;
  monsterId: number;
  unlockCondition: string;
  killCountRequired: number;
  bossKillRequired: boolean;
  loreTitle: string;
  loreText: string;
  loreOrder: number;
  createdAt: string;
};

export type DCMonsterDetail = {
  id: string;
  discoveryId: number;
  characterId: number;
  monsterId: number;
  discoveredAsRegular: boolean;
  discoveredAsBoss: boolean;
  firstEncounteredAt: string;
  firstEncounteredFloor: number;
  firstEncounteredDungeonId: number;
  totalEncounters: number;
  totalKills: number;
  totalDefeats: number;
  totalBossEncounters: number;
  totalBossKills: number;
  totalBossDefeats: number;
  lastEncounteredAt: string;
  updatedAt: string;
  dungeonInfo: DCDungeonInfo;
  floorInfo: DCFloorInfo;
  monster: DCMonster;
  drops: DCMonsterDrop[];
  lore: DCLore[];
};

export type DCMonsterDetailResponse = {
  success: boolean;
  data: DCMonsterDetail;
};
