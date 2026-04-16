import { ForgeResourceSearch } from "@/components/forge-search/forge-resource-search";
import { getElariaUpperCityKeyRecipes } from "@/lib/forge-items";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Elaria Upper City — Dungeon Keys",
  description:
    "Search Elaria Upper City dungeon key forge recipes in Dungeon Cities.",
};

export default function ElariaUpperCityKeysForgePage() {
  const recipes = getElariaUpperCityKeyRecipes();
  return (
    <ForgeResourceSearch
      recipes={recipes}
      title="Elaria Upper City — Dungeon Keys"
      description="Search dungeon key forge recipes and their required resources."
      backHref="/forge/elaria-upper-city"
      backLabel="← Elaria Upper City"
    />
  );
}
