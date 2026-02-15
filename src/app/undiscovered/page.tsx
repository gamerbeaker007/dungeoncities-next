import { UndiscoveredMonstersList } from "@/components/undiscovered/undiscovered-monsters-list";
import { getMonsterDiscoveryList } from "@/lib/monster-data";

export const dynamic = "force-static";

export default function UndiscoveredPage() {
  const monsters = getMonsterDiscoveryList();
  return <UndiscoveredMonstersList monsters={monsters} />;
}
