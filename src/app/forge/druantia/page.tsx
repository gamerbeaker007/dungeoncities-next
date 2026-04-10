import { ForgeResourceSearch } from "@/components/forge-search/forge-resource-search";
import { getDruantiaRecipes } from "@/lib/forge-items";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Druantia Forge",
  description: "Browse and search Druantia forge recipes in Dungeon Cities.",
};

export default function DruantiaForgePage() {
  const recipes = getDruantiaRecipes();
  return (
    <ForgeResourceSearch
      recipes={recipes}
      title="Druantia Forge"
      description="Search Druantia forge recipes and their required resources."
      backHref="/forge"
      backLabel="← All cities"
    />
  );
}
