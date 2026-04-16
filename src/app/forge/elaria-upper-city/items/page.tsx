import { ForgeResourceSearch } from "@/components/forge-search/forge-resource-search";
import { getElariaUpperCityItemRecipes } from "@/lib/forge-items";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Elaria Upper City — Items & Equipment",
  description:
    "Search Elaria Upper City equipment and item forge recipes in Dungeon Cities.",
};

export default function ElariaUpperCityItemsForgePage() {
  const recipes = getElariaUpperCityItemRecipes();
  return (
    <ForgeResourceSearch
      recipes={recipes}
      title="Elaria Upper City — Items & Equipment"
      description="Search weapon, armour, accessory and other equipment forge recipes."
      backHref="/forge/elaria-upper-city"
      backLabel="← Elaria Upper City"
    />
  );
}
