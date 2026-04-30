export type DCInventoryStatusResponse = {
  usedSpace: number;
  totalSpace: number;
  availableSpace: number;
  spaceNeededForNewItems?: number;
  activeSetBonuses: unknown[];
};

export type DCChestDrop = {
  itemId: number;
  name: string;
  description: string;
  class: string;
  quantity: number;
  imageUrl: string;
  image: string;
};

export type DCOpenChestResponse = {
  success: boolean;
  message: string;
  drops: DCChestDrop[];
  currencyRewards: unknown[];
  character: DCChestCharacter;
};

export type DCCollectChestDropsResponse = {
  success: boolean;
  message: string;
  character: DCChestCharacter;
};

export type DCChestCharacter = {
  id: string;
  characterId: number;
  name: string;
  currentState: string;
};
