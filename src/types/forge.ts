import forgeDruantiaData from "@/data/forge_druantia.json";

export type forgeItems = typeof forgeDruantiaData;

export type ForgeRequirement = {
  itemId: number | null;
  name: string;
  quantity: number;
  ownedQuantity?: number;
  imageUrl: string | null;
  searchHref: string;
  matched?: boolean;
};

export type ForgeRecipe = {
  recipeId: number;
  recipeName: string;
  description: string;
  recipeImageUrl: string | null;
  cost: number;
  costCurrency: string;
  isCrafted?: boolean;
  requirements: ForgeRequirement[];
};

export type ForgeRecipeSearchResult = ForgeRecipe;
