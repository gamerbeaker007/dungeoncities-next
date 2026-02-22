import { UndiscoveredMonstersList } from "@/components/undiscovered/undiscovered-monsters-list";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Undiscovered Monsters",
  description:
    "Track which Dungeon Cities monsters are still undiscovered or not fully explored.",
};

export default function UndiscoveredPage() {
  return <UndiscoveredMonstersList />;
}
