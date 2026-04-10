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

export type ForgeCity = "brighthollow" | "druantia" | "elaria_lower_city";

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
  playerInfo?: ForgeRecipePlayerInfo;
};

export type ForgeRecipeSearchResult = ForgeRecipe;
