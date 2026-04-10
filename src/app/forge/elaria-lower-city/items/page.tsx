import { ForgeResourceSearch } from "@/components/forge-search/forge-resource-search";
import { getElariaLowerCityItemRecipes } from "@/lib/forge-items";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Elaria Lower City — Items & Equipment",
  description:
    "Search Elaria Lower City equipment and item forge recipes in Dungeon Cities.",
};

export default function ElariaItemsForgePage() {
  const recipes = getElariaLowerCityItemRecipes();
  return (
    <ForgeResourceSearch
      recipes={recipes}
      title="Elaria Lower City — Items & Equipment"
      description="Search weapon, armour, accessory and other equipment forge recipes."
      backHref="/forge/elaria-lower-city"
      backLabel="← Elaria Lower City"
    />
  );
}
