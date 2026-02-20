import { ForgeResourceSearch } from "@/components/forge-search/forge-resource-search";
import { getForgeRecipes } from "@/lib/forge-items";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Forge Search",
  description: "Search forge recipes and required resources in Dungeon Cities.",
};

export default function ForgePage() {
  const recipes = getForgeRecipes();
  return <ForgeResourceSearch recipes={recipes} />;
}
