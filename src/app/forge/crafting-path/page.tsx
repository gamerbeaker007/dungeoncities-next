import { ForgeCraftingPath } from "@/components/forge-search/forge-crafting-path";
import { getCraftingChainSetNames, getCraftingChains } from "@/lib/forge-items";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Forge Crafting Path",
  description:
    "View the full step-by-step crafting chain for every S-Class equipment set in Dungeon Cities.",
};

export default function ForgeCraftingPathPage() {
  const chains = getCraftingChains();
  const setNames = getCraftingChainSetNames();
  return <ForgeCraftingPath chains={chains} setNames={setNames} />;
}
