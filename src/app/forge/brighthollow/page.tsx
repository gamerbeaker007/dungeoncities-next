import { ForgeResourceSearch } from "@/components/forge-search/forge-resource-search";
import { getBrighthollowRecipes } from "@/lib/forge-items";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Brighthollow Forge",
  description:
    "Browse and search Brighthollow forge recipes in Dungeon Cities.",
};

export default function BrighthollowForgePage() {
  const recipes = getBrighthollowRecipes();
  return (
    <ForgeResourceSearch
      recipes={recipes}
      title="Brighthollow Forge"
      description="Search Brighthollow forge recipes and their required resources."
      backHref="/forge"
      backLabel="← All cities"
    />
  );
}
