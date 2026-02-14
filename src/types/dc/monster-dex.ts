export type DCDexDiscovery = {
  monsterId?: number;
};

export type DCDexDiscoveryStats = {
  totalDiscovered?: number;
  regularDiscovered?: number | string;
  bossDiscovered?: number | string;
  completionPercentage?: number;
  totalKills?: number | string;
  totalBossKills?: number | string;
};

export type DCDexResponse = {
  success?: boolean;
  data?: {
    discoveries?: DCDexDiscovery[];
    stats?: DCDexDiscoveryStats;
    totalMonstersInGame?: number;
  };
};

export type DCItem = {
  itemId?: number;
  name?: string | null;
  class?: string | null;
  imageUrl?: string | null;
};

export type DCMonsterDrop = {
  id?: string;
  monsterDropId?: number;
  monsterId?: number;
  itemId?: number | null;
  dropChance?: string | number | null;
  minQuantity?: string | number | null;
  maxQuantity?: string | number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  bossDrop?: boolean;
  item?: DCItem | null;
  unlocked?: boolean;
};

export type DCDungeonInfo = {
  dungeonId?: number;
  name?: string | null;
  totalFloors?: number;
};

export type DCFloorInfo = {
  floorId?: number;
  name?: string | null;
  floorNumber?: number | null;
  class?: string | null;
};

export type DCMonster = {
  monsterId?: number;
  name?: string | null;
  type?: string | null;
  class?: string | null;
  minHp?: number | null;
  maxHp?: number | null;
  minAttack?: number | null;
  maxAttack?: number | null;
  minDefense?: number | null;
  maxDefense?: number | null;
  stamina?: number | null;
  experienceReward?: number | null;
  imageUrl?: string | null;
};

export type DCLore = {
  id?: string;
  loreId?: number;
  monsterId?: number;
  unlockCondition?: string | null;
  killCountRequired?: number | null;
  bossKillRequired?: boolean;
  loreTitle?: string | null;
  loreText?: string | null;
  loreOrder?: number | null;
  createdAt?: string | null;
};

export type DCMonsterDetail = {
  id?: string;
  discoveryId?: number;
  characterId?: number;
  monsterId?: number;
  discoveredAsRegular?: boolean;
  discoveredAsBoss?: boolean;
  firstEncounteredAt?: string | null;
  firstEncounteredFloor?: number | null;
  firstEncounteredDungeonId?: string | null;
  totalEncounters?: number;
  totalKills?: number;
  totalDefeats?: number;
  totalBossEncounters?: number;
  totalBossKills?: number;
  totalBossDefeats?: number;
  lastEncounteredAt?: string | null;
  updatedAt?: string | null;
  dungeonInfo?: DCDungeonInfo;
  floorInfo?: DCFloorInfo;
  monster?: DCMonster;
  drops?: DCMonsterDrop[];
  lore?: DCLore[];
};

export type DCMonsterDetailResponse = {
  success?: boolean;
  data?: DCMonsterDetail;
};
