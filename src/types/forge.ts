import forgeDruantiaData from "@/data/forge_druantia.json";

export type forgeItems = typeof forgeDruantiaData;

export type ForgeRequirement = {
  itemId: number | null;
  name: string;
  quantity: number;
  imageUrl: string | null;
  searchHref: string;
  matched?: boolean;
};

export type ForgeOwnedPlayerData = {
  total: number;
  inventory: number;
  listed: number;
  expired: number;
};

export type ForgeRecipePlayerInfo = {
  isCrafted: boolean;
  ownedData: ForgeOwnedPlayerData[];
};

export type ForgeCity =
  | "brighthollow"
  | "druantia"
  | "elaria_lower_city"
  | "elaria_upper_city";

export type ForgeRecipe = {
  recipeId: number;
  recipeName: string;
  description: string;
  recipeImageUrl: string | null;
  cost: number;
  costCurrency: string;
  requirements: ForgeRequirement[];
  city: ForgeCity;
  category: string;
  itemClass: string;
  playerInfo?: ForgeRecipePlayerInfo;
};

export type ParsedStat = {
  name: string;
  value: number;
};

export type EquipmentSetItem = {
  category: string;
  recipeName: string;
  recipeId: number;
  stats: ParsedStat[];
  craftCost: number;
  costCurrency: string;
};

export type EquipmentSet = {
  setName: string;
  itemClass: string;
  city: ForgeCity;
  cityLabel: string;
  items: EquipmentSetItem[];
  totalStats: ParsedStat[];
  totalCraftCost: number;
  costCurrency: string;
};

// ---------------------------------------------------------------------------
// Crafting chain types
// ---------------------------------------------------------------------------

/** A single step in a crafting chain — one thing you craft */
export type CraftingStep = {
  recipeId: number;
  itemName: string;
  itemClass: string;
  city: ForgeCity;
  cityLabel: string;
  cost: number;
  costCurrency: string;
  /** Raw/non-craftable ingredients needed alongside the previous step's output */
  sideInputs: { name: string; quantity: number; itemId: number | null }[];
  /** The crafted items consumed (always the output of the previous step, listed here for display) */
  craftedInputs: { name: string; quantity: number; itemId: number | null }[];
};

/** The base A-class items required to start the chain */
export type ChainBaseInput = {
  recipeId: number;
  itemName: string;
  itemClass: string;
  city: ForgeCity;
  cityLabel: string;
};

/** Full crafting chain for one slot (e.g. Weapon) of a set */
export type CraftingChainSlot = {
  category: string;
  /** Ordered from first craft to final item */
  steps: CraftingStep[];
  /** The A-class items required at the very start */
  baseInputs: ChainBaseInput[];
};

/** All slots' chains for a final set name (e.g. "Necrowort") */
export type CraftingChain = {
  setName: string;
  slots: CraftingChainSlot[];
};

export type ForgeRecipeSearchResult = ForgeRecipe;
