import type { Metadata } from "next";
import { ResourceSearch } from "../components/resource-search/resource-search";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Resource Finder",
  description:
    "Search resource drops by monster and see where that monster was first discovered.",
};

export default function Home() {
  return <ResourceSearch />;
}
