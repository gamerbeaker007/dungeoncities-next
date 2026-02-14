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

function buildResourceSearchHref(itemId: number | null, itemName: string) {
  const params = new URLSearchParams();
  // Use itemId if available, otherwise fall back to name
  if (itemId !== null && itemId > 0) {
    params.set("q", String(itemId));
  } else {
    params.set("q", itemName);
  }
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
      const itemId = requirement.itemId ?? null;
      const name = normalizeRequirementName(requirement.item?.name);
      return {
        itemId,
        name,
        quantity: requirement.quantity ?? 0,
        imageUrl: requirement.item?.imageUrl ?? null,
        searchHref: buildResourceSearchHref(itemId, name),
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

export function searchForgeRecipes(query: string): ForgeRecipeSearchResult[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return allForgeRecipes;
  }

  // Check if query is a number (for ID search)
  const queryAsNumber = Number(normalized);
  const isIdSearch = Number.isInteger(queryAsNumber) && queryAsNumber > 0;

  return allForgeRecipes
    .map((recipe) => {
      // Check if any requirement matches
      const hasMatchingRequirement = recipe.requirements.some((requirement) => {
        if (isIdSearch) {
          return requirement.itemId === queryAsNumber;
        }
        return requirement.name.toLowerCase().includes(normalized);
      });

      const recipeMatches = recipe.recipeName
        .toLowerCase()
        .includes(normalized);

      if (!recipeMatches && !hasMatchingRequirement) {
        return null;
      }

      // Add matched flag to each requirement
      const requirementsWithMatch = recipe.requirements.map((requirement) => {
        const matches = isIdSearch
          ? requirement.itemId === queryAsNumber
          : requirement.name.toLowerCase().includes(normalized);

        return {
          ...requirement,
          matched: matches,
        };
      });

      return {
        ...recipe,
        requirements: requirementsWithMatch,
      } as ForgeRecipeSearchResult;
    })
    .filter((recipe): recipe is ForgeRecipeSearchResult => recipe !== null);
}

export function getForgeRecipeDiscoveryStats() {
  const totalRecipes = allForgeRecipes.length;

  // Count fully discovered recipes (no "Unknown" requirements)
  const fullyDiscoveredCount = allForgeRecipes.filter((recipe) => {
    if (recipe.requirements.length === 0) {
      return false; // No requirements means not fully discovered
    }

    // Check if all requirements have known names
    return recipe.requirements.every((requirement) => {
      return requirement.name !== "Unknown";
    });
  }).length;

  const percentage =
    totalRecipes > 0
      ? Math.round((fullyDiscoveredCount / totalRecipes) * 100)
      : 0;

  return {
    totalRecipes,
    fullyDiscoveredCount,
    percentage,
  };
}
