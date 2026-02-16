import { UndiscoveredMonstersList } from "@/components/undiscovered/undiscovered-monsters-list";
import { getMonsterDiscoveryList } from "@/lib/monster-discovery-data";

export const dynamic = "force-static";

export default function UndiscoveredPage() {
  const monsters = getMonsterDiscoveryList();
  return <UndiscoveredMonstersList monsters={monsters} />;
}
