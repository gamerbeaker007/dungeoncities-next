import { getMonsterDiscoveryStats } from "@/lib/monster-discovery-data";
import { getAllResourceRows } from "@/lib/resource-search-data";
import { ResourceSearch } from "../components/resource-search/resource-search";

export const dynamic = "force-static";

export default function Home() {
  const rows = getAllResourceRows();
  const discoveryStats = getMonsterDiscoveryStats();
  return <ResourceSearch initialRows={rows} discoveryStats={discoveryStats} />;
}
