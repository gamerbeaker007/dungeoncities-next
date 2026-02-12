"use client";

import { ForgeRecipeCard } from "@/components/forge-search/forge-recipe-card";
import { ForgeSearchForm } from "@/components/forge-search/forge-search-form";
import { searchForgeRecipes } from "@/lib/forge-items";
import type { ForgeRecipe } from "@/types/forge";
import { Box, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";

type ForgeResourceSearchProps = {
  recipes: ForgeRecipe[];
};

export function ForgeResourceSearch({ recipes }: ForgeResourceSearchProps) {
  const [query, setQuery] = useState("");

  const filteredRecipes = useMemo(() => searchForgeRecipes(query), [query]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Forge Resource Finder (Druantia)
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

      <Typography variant="body2" color="text.secondary">
        Showing {filteredRecipes.length} of {recipes.length} recipe(s)
      </Typography>

      {filteredRecipes.length === 0 ? (
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
          {filteredRecipes.map((recipe) => (
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
                matchedRequirements={recipe.matchedRequirements}
                otherRequirements={recipe.otherRequirements}
              />
            </Box>
          ))}
        </Box>
      )}
    </Stack>
  );
}
