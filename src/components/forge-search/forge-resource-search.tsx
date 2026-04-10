"use client";

import { ForgeRecipeCard } from "@/components/forge-search/forge-recipe-card";
import { ForgeSearchForm } from "@/components/forge-search/forge-search-form";
import { useLockItems } from "@/hooks/use-lock-items";
import { useMarket } from "@/hooks/use-market";
import { searchForgeRecipes } from "@/lib/forge-items";
import type { ForgeCity, ForgeRecipe } from "@/types/forge";
import {
  Alert,
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";

type ForgeResourceSearchProps = {
  recipes: ForgeRecipe[];
};

export function ForgeResourceSearch({ recipes }: ForgeResourceSearchProps) {
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<"all" | ForgeCity>("all");
  const [hideCrafted, setHideCrafted] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { itemQuantitiesByItemId, locationWarning } = useMarket();
  const { lockedItemIds, toggleLock } = useLockItems();

  const filteredRecipes = useMemo(() => searchForgeRecipes(query), [query]);

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
    if (cityFilter !== "all") {
      result = result.filter((r) => r.city === cityFilter);
    }
    if (hideCrafted) {
      result = result.filter((r) => !r.playerInfo?.isCrafted);
    }
    if (categoryFilter !== "all") {
      result = result.filter(
        (r) => r.category.toLowerCase() === categoryFilter.toLowerCase(),
      );
    }
    return result;
  }, [enrichedRecipes, cityFilter, hideCrafted, categoryFilter]);

  const availableCategories = useMemo(() => {
    let base = enrichedRecipes;
    if (cityFilter !== "all") {
      base = base.filter((r) => r.city === cityFilter);
    }
    const cats = Array.from(
      new Set(base.map((r) => r.category).filter(Boolean)),
    ).sort();
    return cats;
  }, [enrichedRecipes, cityFilter]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Forge Resource Finder
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search a resource to see which forge recipes use it, the other
          required items, and crafting cost.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          <Link suppressHydrationWarning href="/">
            Back to Monster Resource Finder
          </Link>
        </Typography>
      </Box>

      <ForgeSearchForm query={query} onSubmit={setQuery} />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        flexWrap="wrap"
      >
        <ToggleButtonGroup
          value={cityFilter}
          exclusive
          onChange={(_e, val: "all" | ForgeCity | null) => {
            if (val !== null) setCityFilter(val);
          }}
          size="small"
          aria-label="city filter"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="brighthollow">Brighthollow</ToggleButton>
          <ToggleButton value="druantia">Druantia</ToggleButton>
          <ToggleButton value="elaria_lower_city">
            Elaria Lower City
          </ToggleButton>
        </ToggleButtonGroup>

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
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
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
