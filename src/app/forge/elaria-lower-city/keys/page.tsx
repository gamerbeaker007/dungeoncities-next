import { ForgeResourceSearch } from "@/components/forge-search/forge-resource-search";
import { getElariaLowerCityKeyRecipes } from "@/lib/forge-items";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Elaria Lower City — Dungeon Keys",
  description:
    "Search Elaria Lower City dungeon key forge recipes in Dungeon Cities.",
};

export default function ElariaKeysForgePage() {
  const recipes = getElariaLowerCityKeyRecipes();
  return (
    <ForgeResourceSearch
      recipes={recipes}
      title="Elaria Lower City — Dungeon Keys"
      description="Search dungeon key forge recipes and their required resources."
      backHref="/forge/elaria-lower-city"
      backLabel="← Elaria Lower City"
    />
  );
}
