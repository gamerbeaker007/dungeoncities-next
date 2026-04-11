"use client";

import { ForgeRecipeCard } from "@/components/forge-search/forge-recipe-card";
import { ForgeSearchForm } from "@/components/forge-search/forge-search-form";
import { useLockItems } from "@/hooks/use-lock-items";
import { useMarket } from "@/hooks/use-market";
import { searchForgeRecipes } from "@/lib/forge-items";
import type { ForgeRecipe } from "@/types/forge";
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

type ForgeResourceSearchProps = {
  recipes: ForgeRecipe[];
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

// ---------------------------------------------------------------------------
// Inner component — uses useSearchParams, must be inside Suspense
// ---------------------------------------------------------------------------
function ForgeResourceSearchContent({
  recipes,
  title = "Forge Resource Finder",
  description = "Search a resource to see which forge recipes use it, the other required items, and crafting cost.",
  backHref = "/forge",
  backLabel = "Back to Forge",
}: ForgeResourceSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "all";

  const [hideCrafted, setHideCrafted] = useState(true);
  const { itemQuantitiesByItemId, locationWarning } = useMarket();
  const { lockedItemIds, toggleLock } = useLockItems();

  const updateUrl = (nextQuery: string, nextCategory: string) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory !== "all") params.set("category", nextCategory);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const filteredRecipes = useMemo(
    () => searchForgeRecipes(urlQuery, recipes),
    [urlQuery, recipes],
  );

  const enrichedRecipes: ForgeRecipe[] = useMemo(() => {
    return filteredRecipes.map((recipe) => {
      const isCrafted =
        (itemQuantitiesByItemId[recipe.recipeId]?.total ?? 0) > 0;

      return {
        ...recipe,
        playerInfo: {
          isCrafted,
          ownedData: recipe.requirements.map((requirement) => ({
            total:
              requirement.itemId !== null
                ? (itemQuantitiesByItemId[requirement.itemId]?.total ?? 0)
                : 0,
            inventory:
              requirement.itemId !== null
                ? (itemQuantitiesByItemId[requirement.itemId]?.inventory ?? 0)
                : 0,
            listed:
              requirement.itemId !== null
                ? (itemQuantitiesByItemId[requirement.itemId]?.listed ?? 0)
                : 0,
            expired:
              requirement.itemId !== null
                ? (itemQuantitiesByItemId[requirement.itemId]?.expired ?? 0)
                : 0,
          })),
        },
      };
    });
  }, [filteredRecipes, itemQuantitiesByItemId]);

  const displayedRecipes = useMemo(() => {
    let result = enrichedRecipes;
    if (hideCrafted) {
      result = result.filter((r) => !r.playerInfo?.isCrafted);
    }
    if (urlCategory !== "all") {
      result = result.filter(
        (r) => r.category.toLowerCase() === urlCategory.toLowerCase(),
      );
    }
    return result;
  }, [enrichedRecipes, hideCrafted, urlCategory]);

  const availableCategories = useMemo(() => {
    const cats = Array.from(
      new Set(enrichedRecipes.map((r) => r.category).filter(Boolean)),
    ).sort();
    return cats;
  }, [enrichedRecipes]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          <Link suppressHydrationWarning href={backHref}>
            {backLabel}
          </Link>
        </Typography>
      </Box>

      <ForgeSearchForm
        query={urlQuery}
        onSubmit={(q) => updateUrl(q, urlCategory)}
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        flexWrap="wrap"
      >
        <FormControlLabel
          control={
            <Switch
              checked={hideCrafted}
              onChange={(e) => setHideCrafted(e.target.checked)}
              size="small"
            />
          }
          label="Hide crafted"
        />
      </Stack>

      {availableCategories.length > 1 && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              value={urlCategory}
              label="Category"
              onChange={(e) => updateUrl(urlQuery, e.target.value)}
            >
              <MenuItem value="all">All categories</MenuItem>
              {availableCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      )}

      {locationWarning && <Alert severity="warning">{locationWarning}</Alert>}

      <Typography variant="body2" color="text.secondary">
        Showing {displayedRecipes.length} of {recipes.length} recipe(s)
      </Typography>

      {displayedRecipes.length === 0 ? (
        <Typography variant="body1">No recipes found.</Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "stretch",
          }}
        >
          {displayedRecipes.map((recipe) => (
            <Box
              key={`${recipe.recipeId}-${recipe.recipeName}`}
              sx={{
                minWidth: { xs: "100%", sm: 360 },
              }}
            >
              <ForgeRecipeCard
                recipeName={recipe.recipeName}
                description={recipe.description}
                recipeImageUrl={recipe.recipeImageUrl}
                cost={recipe.cost}
                costCurrency={recipe.costCurrency}
                category={recipe.category}
                requirements={recipe.requirements}
                playerInfo={recipe.playerInfo}
                lockedItemIds={lockedItemIds}
                onToggleLock={toggleLock}
              />
            </Box>
          ))}
        </Box>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Public export — wraps inner component in Suspense (required for useSearchParams)
// ---------------------------------------------------------------------------
export function ForgeResourceSearch(props: ForgeResourceSearchProps) {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ForgeResourceSearchContent {...props} />
    </Suspense>
  );
}
