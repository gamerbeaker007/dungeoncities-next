import { ForgeSetBrowser } from "@/components/forge-search/forge-set-browser";
import { getEquipmentSetClasses, getEquipmentSets } from "@/lib/forge-items";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Forge Equipment Sets",
  description:
    "All equipment sets in Dungeon Cities with stats and total stat summaries, grouped by class.",
};

export default function ForgeSetsPage() {
  const sets = getEquipmentSets();
  const availableClasses = getEquipmentSetClasses();
  return <ForgeSetBrowser sets={sets} availableClasses={availableClasses} />;
}
