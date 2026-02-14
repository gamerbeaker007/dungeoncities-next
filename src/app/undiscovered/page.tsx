import { UndiscoveredMonstersList } from "@/components/undiscovered/undiscovered-monsters-list";
import { getUndiscoveredMonsters } from "@/lib/monster-data";

export const dynamic = "force-static";

export default function UndiscoveredPage() {
  const undiscoveredMonsters = getUndiscoveredMonsters();
  return <UndiscoveredMonstersList monsters={undiscoveredMonsters} />;
}
