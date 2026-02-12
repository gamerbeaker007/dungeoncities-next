export type DCDexDiscovery = {
  monsterId?: number;
};

export type DCDexResponse = {
  success?: boolean;
  data?: {
    discoveries?: DCDexDiscovery[];
  };
};

export type DCMonsterDrop = {
  itemId?: number | null;
  dropChance?: string | number | null;
  bossDrop?: boolean;
  unlocked?: boolean;
  item?: {
    name?: string | null;
    class?: string | null;
    imageUrl?: string | null;
  } | null;
};

export type DCMonsterDetail = {
  monsterId?: number;
  firstEncounteredAt?: string | null;
  firstEncounteredFloor?: number | null;
  firstEncounteredDungeonId?: string | null;
  dungeonInfo?: {
    name?: string | null;
  };
  floorInfo?: {
    floorNumber?: number | null;
    name?: string | null;
  };
  monster?: {
    monsterId?: number;
    name?: string | null;
    type?: string | null;
    class?: string | null;
    imageUrl?: string | null;
  };
  drops?: DCMonsterDrop[];
};

export type DCMonsterDetailResponse = {
  success?: boolean;
  data?: DCMonsterDetail;
};
