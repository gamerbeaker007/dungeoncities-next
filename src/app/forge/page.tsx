import { ForgeResourceSearch } from "@/components/forge-search/forge-resource-search";
import { getForgeRecipes } from "@/lib/forge-items";

export const dynamic = "force-static";

export default function ForgePage() {
  const recipes = getForgeRecipes();
  return <ForgeResourceSearch recipes={recipes} />;
}
