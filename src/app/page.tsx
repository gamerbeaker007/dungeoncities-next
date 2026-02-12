import { getAllResourceRows } from "@/lib/monster-data";
import { ResourceSearch } from "../components/resource-search/resource-search";

export const dynamic = "force-static";

export default function Home() {
  const rows = getAllResourceRows();
  return <ResourceSearch initialRows={rows} />;
}
