import forgeDruantiaData from "@/data/forge_druantia.json";
import type {
  ForgeRecipe,
  ForgeRecipeSearchResult,
  ForgeRequirement,
  forgeItems,
} from "@/types/forge";

type ForgeRecipeRaw = {
  recipe?: {
    id?: number;
    name?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    discountedCost?: number | null;
    baseCost?: number | null;
    costCurrency?: string | null;
  };
  requirements?: Array<{
    itemId?: number | null;
    quantity?: number | null;
    item?: {
      name?: string | null;
      imageUrl?: string | null;
    } | null;
  }>;
};

function buildResourceSearchHref(itemName: string) {
  const params = new URLSearchParams();
  params.set("q", itemName);
  return `/?${params.toString()}`;
}

function normalizeRequirementName(value: string | null | undefined) {
  const normalized = (value ?? "Unknown").trim();
  return normalized.length ? normalized : "Unknown";
}

function mapRecipe(raw: ForgeRecipeRaw): ForgeRecipe {
  const recipeName =
    (raw.recipe?.name ?? "Unknown Recipe").trim() || "Unknown Recipe";
  const recipeId = raw.recipe?.id ?? -1;
  const cost = raw.recipe?.discountedCost ?? raw.recipe?.baseCost ?? 0;
  const costCurrency =
    (raw.recipe?.costCurrency ?? "DRUBBLE").trim() || "DRUBBLE";

  const requirements: ForgeRequirement[] = (raw.requirements ?? []).map(
    (requirement) => {
      const name = normalizeRequirementName(requirement.item?.name);
      return {
        itemId: requirement.itemId ?? null,
        name,
        quantity: requirement.quantity ?? 0,
        imageUrl: requirement.item?.imageUrl ?? null,
        searchHref: buildResourceSearchHref(name),
      };
    },
  );

  return {
    recipeId,
    recipeName,
    description: raw.recipe?.description?.trim() ?? "",
    recipeImageUrl: raw.recipe?.imageUrl ?? null,
    cost,
    costCurrency,
    requirements,
  };
}

const recipesRaw =
  ((forgeDruantiaData as forgeItems)?.data?.recipes as
    | ForgeRecipeRaw[]
    | undefined) ?? [];

const allForgeRecipes = recipesRaw.map(mapRecipe);

export function getForgeRecipes() {
  return allForgeRecipes;
}

export function searchForgeRecipes(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return allForgeRecipes.map((recipe) => ({
      ...recipe,
      matchedRequirements: recipe.requirements,
      otherRequirements: [] as ForgeRequirement[],
    }));
  }

  return allForgeRecipes
    .map((recipe) => {
      const matchedRequirements = recipe.requirements.filter((requirement) =>
        requirement.name.toLowerCase().includes(normalized),
      );

      const recipeMatches = recipe.recipeName
        .toLowerCase()
        .includes(normalized);
      if (!recipeMatches && matchedRequirements.length === 0) {
        return null;
      }

      const otherRequirements = recipe.requirements.filter(
        (requirement) =>
          !matchedRequirements.some(
            (matchedRequirement) =>
              matchedRequirement.itemId === requirement.itemId &&
              matchedRequirement.name === requirement.name,
          ),
      );

      return {
        ...recipe,
        matchedRequirements:
          matchedRequirements.length > 0
            ? matchedRequirements
            : recipe.requirements,
        otherRequirements,
      };
    })
    .filter((recipe): recipe is ForgeRecipeSearchResult => recipe !== null);
}
