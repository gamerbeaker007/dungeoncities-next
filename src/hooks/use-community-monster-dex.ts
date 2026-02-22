"use client";

/**
 * useCommunityMonsterDex
 *
 * Loads the community combined monster data from Supabase Storage via a
 * server action (no direct Supabase SDK calls in the browser).
 *
 * Returns enriched monster list items with `encountered`, `discovered`, and
 * `fullyDiscovered` flags computed from the community drop data.
 */

import { getCommunityMonsterDataAction } from "@/actions/sync-actions";
import {
  buildDiscoveryListFromRecords,
  type MonsterDiscoveryListItem,
} from "@/lib/monster-discovery-data";
import type { MonsterDexData } from "@/types/monter";
import { useEffect, useMemo, useState } from "react";

export type CommunityMonsterDex = {
  /** Enriched list with `encountered`, `discovered`, `fullyDiscovered` flags */
  monsters: MonsterDiscoveryListItem[];
  totalMonsters: number;
  totalDiscoveries: number;
  loading: boolean;
  /** True when community data was successfully loaded from Supabase. */
  hasData: boolean;
  error: string | null;
};

export function useCommunityMonsterDex(): CommunityMonsterDex {
  const [data, setData] = useState<MonsterDexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCommunityMonsterDataAction()
      .then((result) => setData(result))
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load community data",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const monsters = useMemo(
    () => buildDiscoveryListFromRecords(data?.monsters ?? []),
    [data],
  );

  return {
    monsters,
    totalMonsters: data?.totalMonsters ?? 0,
    totalDiscoveries: data?.totalDiscoveries ?? 0,
    loading,
    hasData: data !== null,
    error,
  };
}
