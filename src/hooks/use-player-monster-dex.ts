"use client";

/**
 * usePlayerMonsterDex
 *
 * Manages the player's personal monster data.
 *
 * - Reads raw personal stats from localStorage on mount.
 * - Exposes a `sync()` function that runs the full multi-step sync flow
 *   (init → batch fetch → commit to Supabase) and saves the personal result
 *   back to localStorage. All Supabase writes happen via server actions.
 * - Does NOT merge with community data — the component handles that.
 */

import {
  commitSyncAction,
  fetchMonsterDetailAction,
  initSyncAction,
} from "@/actions/sync-actions";
import {
  buildDiscoveryListFromRecords,
  type MonsterDiscoveryListItem,
} from "@/lib/monster-discovery-data";
import {
  canSyncNow,
  loadPersonalSyncData,
  minutesUntilNextSync,
  recordSyncTime,
  savePersonalSyncData,
  subscribeSyncTime,
} from "@/lib/syncHelper";
import { useAuth } from "@/providers/auth-provider";
import type { MonsterDexData, MonsterRecord } from "@/types/monter";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SYNC_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncPhase = "idle" | "init" | "fetching" | "committing" | "done";

export type PlayerMonsterDex = {
  /** Personal monsters with encounter stats embedded. */
  monsters: MonsterDiscoveryListItem[];
  /** Total unique monsters the player has in their dex (0 if never synced). */
  totalMonsters: number;
  /** Total discoveries recorded in the last sync. */
  totalDiscoveries: number;
  /** True while a sync is running */
  syncing: boolean;
  /** Current sync phase */
  phase: SyncPhase;
  /** 0–100 progress value for a LinearProgress bar */
  progress: number;
  /** Human-readable status string during sync */
  statusText: string;
  /** Error message from the last sync attempt, or null */
  error: string | null;
  /** Green success message: "Synced N monsters." */
  successText: string | null;
  /** Yellow warning: partial fetch failures or community upload error */
  communityWarning: string | null;
  /** True when the user is authenticated and no rate-limit is active */
  canSync: boolean;
  /** Minutes remaining until the next sync is allowed (0 = ready) */
  minutesUntilSync: number;
  /** Trigger a full sync — no-op if canSync is false */
  sync: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePlayerMonsterDex(): PlayerMonsterDex {
  const { isAuthenticated, token } = useAuth();

  const [personalData, setPersonalData] = useState<MonsterDexData | null>(() =>
    loadPersonalSyncData(),
  );
  const [phase, setPhase] = useState<SyncPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [communityWarning, setCommunityWarning] = useState<string | null>(null);
  // useSyncExternalStore: server snapshot = 0 (hydration-safe),
  // client snapshot reads localStorage; re-renders when recordSyncTime() fires.
  const minutesLeft = useSyncExternalStore(
    subscribeSyncTime,
    minutesUntilNextSync,
    () => 0,
  );

  const syncing = phase !== "idle" && phase !== "done";

  // Build personal monster list purely from localStorage data.
  // Uses the full records (with drops) stored during the last sync.
  const monsters = useMemo(
    () => buildDiscoveryListFromRecords(personalData?.monsters ?? []),
    [personalData],
  );

  const sync = useCallback(async () => {
    if (!token || !canSyncNow()) return;

    setPhase("init");
    setProgress(0);
    setError(null);
    setSuccessText(null);
    setCommunityWarning(null);
    setStatusText("Fetching monster list...");

    try {
      // ── Step 1: init ────────────────────────────────────────────────────
      const initResult = await initSyncAction(token);
      if (!initResult.success) {
        setError(initResult.error);
        setPhase("idle");
        return;
      }

      const { monsterIds, totalMonstersInGame, totalDiscoveries } = initResult;
      const total = monsterIds.length;

      setPhase("fetching");
      setStatusText(`Fetching 0 of ${total} monsters...`);

      // ── Step 2: client-side loop — one server action per monster ────────
      // Each call is a single API request, well under Vercel's 10s timeout.
      const personalRecords: MonsterRecord[] = [];
      let totalFailed = 0;

      for (let i = 0; i < monsterIds.length; i++) {
        if (i > 0) await sleep(SYNC_DELAY_MS);

        const result = await fetchMonsterDetailAction(token, monsterIds[i]);
        if (result.success) {
          personalRecords.push(result.record);
        } else {
          totalFailed++;
        }

        setStatusText(`Fetching ${i + 1} of ${total} monsters...`);
        // 0→90 during fetching, 90→100 reserved for commit
        setProgress(Math.round(((i + 1) / total) * 90));
      }

      // ── Step 3: commit community data to Supabase ────────────────────────
      setPhase("committing");
      setProgress(92);
      setStatusText("Uploading to community database...");

      const commitResult = await commitSyncAction(
        personalRecords,
        totalMonstersInGame,
        totalDiscoveries,
      );

      const personal: MonsterDexData = {
        lastUpdated: new Date().toISOString(),
        totalDiscoveries,
        totalMonsters: totalMonstersInGame,
        monsters: personalRecords,
      };
      savePersonalSyncData(personal);
      recordSyncTime();
      setPersonalData(personal);
      setProgress(100);
      setPhase("done");

      setSuccessText(`Synced ${personalRecords.length} monsters.`);

      const warnings: string[] = [];
      if (totalFailed > 0)
        warnings.push(
          `${totalFailed} monster${totalFailed !== 1 ? "s" : ""} failed to fetch.`,
        );
      if (!commitResult.success)
        warnings.push(`Community upload failed: ${commitResult.error}`);
      setCommunityWarning(warnings.length > 0 ? warnings.join(" ") : null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sync failed. Please try again.",
      );
      setPhase("idle");
    }
  }, [token]);

  return {
    monsters,
    totalMonsters: personalData?.totalMonsters ?? 0,
    totalDiscoveries: personalData?.totalDiscoveries ?? 0,
    syncing,
    phase,
    progress,
    statusText,
    error,
    successText,
    communityWarning,
    canSync: isAuthenticated && !syncing && minutesLeft === 0,
    minutesUntilSync: minutesLeft,
    sync,
  };
}
