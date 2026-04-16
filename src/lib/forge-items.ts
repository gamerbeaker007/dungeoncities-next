import forgeBrighthollowData from "@/data/forge_brighthollow.json";
import forgeDruantiaData from "@/data/forge_druantia.json";
import forgeElariaLowerCityData from "@/data/forge_elaria_lower_city.json";
import forgeElariaUpperCityData from "@/data/forge_elaria_upper_city.json";
import type {
  ChainBaseInput,
  CraftingChain,
  CraftingChainSlot,
  CraftingStep,
  EquipmentSet,
  EquipmentSetItem,
  ForgeCity,
  ForgeRecipe,
  ForgeRecipeSearchResult,
  ForgeRequirement,
  ParsedStat,
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
    category?: string | null;
    class?: string | null;
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

function mapRecipe(raw: ForgeRecipeRaw, city: ForgeCity): ForgeRecipe {
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
        imageUrl: requirement.item?.imageUrl?.trim() || null,
        searchHref: buildResourceSearchHref(itemId, name),
      };
    },
  );

  const category = (raw.recipe?.category ?? "").trim();
  const itemClass = (raw.recipe?.class ?? "").trim();

  return {
    recipeId,
    recipeName,
    description: raw.recipe?.description?.trim() ?? "",
    recipeImageUrl: raw.recipe?.imageUrl?.trim() || null,
    cost,
    costCurrency,
    requirements,
    city,
    category,
    itemClass,
  };
}

const druantiaRecipesRaw =
  ((forgeDruantiaData as forgeItems)?.data?.recipes as
    | ForgeRecipeRaw[]
    | undefined) ?? [];

const brighthollowRecipesRaw =
  ((forgeBrighthollowData as forgeItems)?.data?.recipes as
    | ForgeRecipeRaw[]
    | undefined) ?? [];

const elariaLowerCityRecipesRaw =
  ((forgeElariaLowerCityData as forgeItems)?.data?.recipes as
    | ForgeRecipeRaw[]
    | undefined) ?? [];

const elariaUpperCityRecipesRaw =
  ((forgeElariaUpperCityData as forgeItems)?.data?.recipes as
    | ForgeRecipeRaw[]
    | undefined) ?? [];

const brighthollowRecipes = brighthollowRecipesRaw.map((r) =>
  mapRecipe(r, "brighthollow"),
);
const druantiaRecipes = druantiaRecipesRaw.map((r) => mapRecipe(r, "druantia"));
const elariaLowerCityRecipes = elariaLowerCityRecipesRaw.map((r) =>
  mapRecipe(r, "elaria_lower_city"),
);

const elariaUpperCityRecipes = elariaUpperCityRecipesRaw.map((r) =>
  mapRecipe(r, "elaria_upper_city"),
);

const allForgeRecipes = [
  ...brighthollowRecipes,
  ...druantiaRecipes,
  ...elariaLowerCityRecipes,
  ...elariaUpperCityRecipes,
];

export function getForgeRecipes() {
  return allForgeRecipes;
}

export function getBrighthollowRecipes() {
  return brighthollowRecipes;
}

export function getDruantiaRecipes() {
  return druantiaRecipes;
}

export function getElariaLowerCityRecipes() {
  return elariaLowerCityRecipes;
}

export function getElariaLowerCityKeyRecipes() {
  return elariaLowerCityRecipes.filter((r) => r.category === "Dungeon Key");
}

export function getElariaLowerCityItemRecipes() {
  return elariaLowerCityRecipes.filter((r) => r.category !== "Dungeon Key");
}

export function getElariaUpperCityRecipes() {
  return elariaUpperCityRecipes;
}

export function getElariaUpperCityKeyRecipes() {
  return elariaUpperCityRecipes.filter((r) => r.category === "Dungeon Key");
}

export function getElariaUpperCityItemRecipes() {
  return elariaUpperCityRecipes.filter((r) => r.category !== "Dungeon Key");
}

export function searchForgeRecipes(
  query: string,
  recipes: ForgeRecipe[] = allForgeRecipes,
): ForgeRecipeSearchResult[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return recipes;
  }

  // Check if query is a number (for ID search)
  const queryAsNumber = Number(normalized);
  const isIdSearch = Number.isInteger(queryAsNumber) && queryAsNumber > 0;

  return recipes
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

// ---------------------------------------------------------------------------
// Equipment sets
// ---------------------------------------------------------------------------

const EQUIPMENT_CATEGORY_ORDER = [
  "Weapon",
  "Shield",
  "Head Gear",
  "Face Gear",
  "Neck Gear",
  "Shoulder Gear",
  "Torso Gear",
  "Arm Gear",
  "Waist Gear",
  "Leg Gear",
  "Hand Gear",
  "Feet Gear",
  "Accessory",
];

const CITY_LABELS: Record<ForgeCity, string> = {
  brighthollow: "Brighthollow",
  druantia: "Druantia",
  elaria_lower_city: "Elaria Lower City",
  elaria_upper_city: "Elaria Upper City",
};

const CLASS_ORDER = ["S", "A", "B", "C", "D", "E", "F"];

function parseStats(description: string): ParsedStat[] {
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(/^(.+?)\s*\+\s*([\d.]+)$/);
      if (!match) return [];
      return [{ name: match[1].trim(), value: parseFloat(match[2]) }];
    });
}

function groupIntoSets(items: ForgeRecipe[]): Map<string, ForgeRecipe[]> {
  const byFirstWord = new Map<string, ForgeRecipe[]>();
  for (const item of items) {
    const firstWord = item.recipeName.split(" ")[0];
    if (!byFirstWord.has(firstWord)) byFirstWord.set(firstWord, []);
    byFirstWord.get(firstWord)!.push(item);
  }

  const sets = new Map<string, ForgeRecipe[]>();
  for (const [firstWord, groupItems] of byFirstWord) {
    const secondWords = groupItems.map(
      (item) => item.recipeName.split(" ")[1] ?? "",
    );
    const uniqueSecondWords = new Set(secondWords);
    if (uniqueSecondWords.size === 1 && secondWords[0]) {
      sets.set(`${firstWord} ${secondWords[0]}`, groupItems);
    } else {
      sets.set(firstWord, groupItems);
    }
  }
  return sets;
}

export function getEquipmentSets(): EquipmentSet[] {
  const equipment = allForgeRecipes.filter((r) => r.category !== "Dungeon Key");

  const byCityClass = new Map<string, ForgeRecipe[]>();
  for (const recipe of equipment) {
    const key = `${recipe.city}|${recipe.itemClass}`;
    if (!byCityClass.has(key)) byCityClass.set(key, []);
    byCityClass.get(key)!.push(recipe);
  }

  const result: EquipmentSet[] = [];

  for (const [key, items] of byCityClass) {
    const [city, itemClass] = key.split("|") as [ForgeCity, string];
    const sets = groupIntoSets(items);

    for (const [setName, setItems] of sets) {
      const parsedItems: EquipmentSetItem[] = setItems.map((item) => ({
        category: item.category,
        recipeName: item.recipeName,
        recipeId: item.recipeId,
        stats: parseStats(item.description),
        craftCost: item.cost,
        costCurrency: item.costCurrency,
      }));

      parsedItems.sort((a, b) => {
        const ai = EQUIPMENT_CATEGORY_ORDER.indexOf(a.category);
        const bi = EQUIPMENT_CATEGORY_ORDER.indexOf(b.category);
        const aIdx = ai === -1 ? 99 : ai;
        const bIdx = bi === -1 ? 99 : bi;
        return aIdx - bIdx;
      });

      const statTotals = new Map<string, number>();
      for (const item of parsedItems) {
        for (const stat of item.stats) {
          statTotals.set(
            stat.name,
            (statTotals.get(stat.name) ?? 0) + stat.value,
          );
        }
      }
      const totalStats: ParsedStat[] = Array.from(statTotals.entries()).map(
        ([name, value]) => ({ name, value }),
      );

      const totalCraftCost = setItems.reduce((sum, item) => sum + item.cost, 0);
      const costCurrency = setItems[0]?.costCurrency ?? "DRUBBLE";

      result.push({
        setName,
        itemClass,
        city,
        cityLabel: CITY_LABELS[city],
        items: parsedItems,
        totalStats,
        totalCraftCost,
        costCurrency,
      });
    }
  }

  result.sort((a, b) => {
    const classCompare =
      CLASS_ORDER.indexOf(a.itemClass) - CLASS_ORDER.indexOf(b.itemClass);
    if (classCompare !== 0) return classCompare;
    const cityCompare = a.cityLabel.localeCompare(b.cityLabel);
    if (cityCompare !== 0) return cityCompare;
    return a.setName.localeCompare(b.setName);
  });

  return result;
}

export function getEquipmentSetClasses(): string[] {
  const sets = getEquipmentSets();
  const classes = [...new Set(sets.map((s) => s.itemClass))];
  return classes.sort(
    (a, b) => CLASS_ORDER.indexOf(a) - CLASS_ORDER.indexOf(b),
  );
}

// ---------------------------------------------------------------------------
// Crafting chains  — traces the full dependency path for any recipe
// ---------------------------------------------------------------------------

/** Build a lookup map from recipeId -> ForgeRecipe for all recipes */
function buildRecipeMap(): Map<number, ForgeRecipe> {
  const map = new Map<number, ForgeRecipe>();
  for (const r of allForgeRecipes) {
    map.set(r.recipeId, r);
  }
  return map;
}

const recipeMap = buildRecipeMap();

/**
 * Walk backwards from `recipeId` collecting each craftable ancestor.
 * Returns steps in order: [root, ..., target] (first craft → last craft).
 */
function traceChain(
  recipeId: number,
  visited = new Set<number>(),
): ForgeRecipe[] {
  if (visited.has(recipeId)) return [];
  visited.add(recipeId);

  const recipe = recipeMap.get(recipeId);
  if (!recipe) return [];

  const steps: ForgeRecipe[] = [];

  for (const req of recipe.requirements) {
    if (req.itemId !== null && recipeMap.has(req.itemId)) {
      const ancestorChain = traceChain(req.itemId, visited);
      steps.push(...ancestorChain);
    }
  }

  steps.push(recipe);
  return steps;
}

/**
 * Derive a set name from a recipe name by taking the first 1–2 distinctive words.
 * E.g. "Necrowort Necromancer's Staff" → "Necrowort"
 *      "Glacier Lily Frost Blade"      → "Glacier Lily"
 */
function deriveSetName(recipeName: string): string {
  const words = recipeName.split(" ");
  // If first two words are both capitalised and neither looks like a generic
  // equipment word, use both; otherwise use just the first word.
  const genericWords = new Set([
    "War",
    "Battle",
    "Iron",
    "Fire",
    "Ice",
    "Dark",
    "Holy",
    "Shadow",
    "Blade",
    "Sword",
    "Axe",
    "Bow",
    "Staff",
    "Mace",
    "Spear",
    "Shield",
    "Helm",
    "Cap",
    "Crown",
    "Plate",
    "Mail",
    "Robe",
    "Boots",
    "Gloves",
    "Ring",
    "Amulet",
    "Earrings",
    "Cloak",
  ]);
  if (
    words.length >= 2 &&
    /^[A-Z]/.test(words[1]) &&
    !genericWords.has(words[1])
  ) {
    return `${words[0]} ${words[1]}`;
  }
  return words[0];
}

/**
 * Build a CraftingChainSlot for one specific recipe (the final item in the chain).
 */
function buildSlot(finalRecipeId: number): CraftingChainSlot | null {
  const finalRecipe = recipeMap.get(finalRecipeId);
  if (!finalRecipe) return null;

  const orderedRecipes = traceChain(finalRecipeId);

  // Separate the base A-class ingredients (recipes that themselves require
  // only non-craftable items, i.e. depth-0 leaves) from S-class steps
  const baseInputs: ChainBaseInput[] = [];
  const steps: CraftingStep[] = [];

  for (const recipe of orderedRecipes) {
    const craftedReqs = recipe.requirements.filter(
      (r) => r.itemId !== null && recipeMap.has(r.itemId),
    );
    const sideInputs = recipe.requirements
      .filter((r) => r.itemId === null || !recipeMap.has(r.itemId!))
      .map((r) => ({ name: r.name, quantity: r.quantity, itemId: r.itemId }));

    if (craftedReqs.length === 0) {
      // This recipe is a base input (A-class items consumed by the first S step)
      baseInputs.push({
        recipeId: recipe.recipeId,
        itemName: recipe.recipeName,
        itemClass: recipe.itemClass,
        city: recipe.city,
        cityLabel: CITY_LABELS[recipe.city],
      });
    } else {
      steps.push({
        recipeId: recipe.recipeId,
        itemName: recipe.recipeName,
        itemClass: recipe.itemClass,
        city: recipe.city,
        cityLabel: CITY_LABELS[recipe.city],
        cost: recipe.cost,
        costCurrency: recipe.costCurrency,
        sideInputs,
        craftedInputs: craftedReqs.map((r) => ({
          name: r.name,
          quantity: r.quantity,
          itemId: r.itemId,
        })),
      });
    }
  }

  return {
    category: finalRecipe.category,
    steps,
    baseInputs,
  };
}

/**
 * Returns one CraftingChain per S-class set name containing all equipment slots.
 * Only Elaria has multi-step chains; other cities are skipped.
 */
export function getCraftingChains(): CraftingChain[] {
  const sRecipes = allForgeRecipes.filter(
    (r) =>
      r.itemClass === "S" &&
      r.category !== "Dungeon Key" &&
      (r.city === "elaria_lower_city" || r.city === "elaria_upper_city"),
  );

  // Group final S-class recipes by derived set name
  const bySet = new Map<string, ForgeRecipe[]>();
  for (const recipe of sRecipes) {
    // Only keep the "terminal" recipe in each chain (the one whose output is
    // NOT a required ingredient for another recipe in this collection)
    const setName = deriveSetName(recipe.recipeName);
    if (!bySet.has(setName)) bySet.set(setName, []);
    bySet.get(setName)!.push(recipe);
  }

  // The terminal items are those whose recipeId is NOT used as a requirement
  // by any other recipe.
  const usedAsInput = new Set<number>();
  for (const r of sRecipes) {
    for (const req of r.requirements) {
      if (req.itemId !== null) usedAsInput.add(req.itemId);
    }
  }

  const chains: CraftingChain[] = [];

  for (const [setName, recipes] of bySet) {
    const terminalRecipes = recipes.filter((r) => !usedAsInput.has(r.recipeId));
    if (terminalRecipes.length === 0) continue;

    const slots: CraftingChainSlot[] = terminalRecipes
      .map((r) => buildSlot(r.recipeId))
      .filter((s): s is CraftingChainSlot => s !== null);

    slots.sort((a, b) => {
      const ai = EQUIPMENT_CATEGORY_ORDER.indexOf(a.category);
      const bi = EQUIPMENT_CATEGORY_ORDER.indexOf(b.category);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    chains.push({ setName, slots });
  }

  chains.sort((a, b) => a.setName.localeCompare(b.setName));
  return chains;
}

export function getCraftingChainSetNames(): string[] {
  return getCraftingChains().map((c) => c.setName);
}
