export type DCItemStats = {
  id: string | null;
  isid: number | null;
  itemId: number | null;
  hp: string | null;
  hpType: string | null;
  maxHp: string | null;
  maxHpType: string | null;
  stamina: string | null;
  staminaType: string | null;
  maxStamina: string | null;
  maxStaminaType: string | null;
  attack: string | null;
  attackType: string | null;
  defense: string | null;
  defenseType: string | null;
  attackTime: string | null;
  attackTimeType: string | null;
  hpRecoveryPerHour: string | null;
  hpRecoveryPerHourType: string | null;
  stmRecoveryPerHour: string | null;
  stmRecoveryPerHourType: string | null;
  inventorySizeBonus: number | null;
  skills: unknown[] | null;
  specialStats: Record<string, unknown> | null;
};

export type DCInventoryItem = {
  id: string;
  itemId: number;
  name: string;
  description: string;
  category: string;
  subCategory: string;
  type: string;
  class: string;
  buyPrice: string;
  sellPrice: string;
  buyCurrency: string;
  sellCurrency: string;
  stackable: boolean;
  consumable: boolean;
  sellable: boolean;
  equipmentSlot: string;
  equipable: boolean;
  transferable: boolean;
  listable: boolean;
  maxListQty: number;
  listingCurrencies: string[];
  cityIds: number[];
  globalQuantityLimit: number | null;
  meta: Record<string, unknown>;
  updatedAt: string;
  image: string | null;
  imageUrl: string;
  imagePriority: string;
  imageLastUpdated: string | null;
  stats: DCItemStats;
  remaining: number | null;
};

export type DCGameInventoryItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  characterId: number;
  itemId: number;
  quantity: number;
  item: DCInventoryItem;
  version: number;
  equipped: boolean;
  equippedSlot: string | null;
  enhancement: unknown;
};

export type DCGameStateRequiredData = {
  character?: {
    inventorySize?: number;
  };
  inventory: DCGameInventoryItem[];
};

export type DCGameStateResponse = {
  state: string;
  stateData: unknown;
  requiredData: DCGameStateRequiredData;
  timestamp: number;
};
