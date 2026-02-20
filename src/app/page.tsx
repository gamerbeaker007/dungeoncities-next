import { getMonsterDiscoveryStats } from "@/lib/monster-discovery-data";
import { getAllResourceRows } from "@/lib/resource-search-data";
import type { Metadata } from "next";
import { ResourceSearch } from "../components/resource-search/resource-search";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Resource Finder",
  description:
    "Search resource drops by monster and see where that monster was first discovered.",
};

export default function Home() {
  const rows = getAllResourceRows();
  const discoveryStats = getMonsterDiscoveryStats();
  return <ResourceSearch initialRows={rows} discoveryStats={discoveryStats} />;
}
