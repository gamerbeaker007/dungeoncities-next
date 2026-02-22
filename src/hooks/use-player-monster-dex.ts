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

import { runFullSyncAction } from "@/actions/sync-actions";
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
import type { MonsterDexData, SyncProgressEvent } from "@/types/monter";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

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
  /** Success message after sync completes, or null */
  successText: string | null;
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
    setStatusText("Fetching monster list...");

    try {
      const stream = await runFullSyncAction(token, SYNC_DELAY_MS);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let total = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event: SyncProgressEvent = JSON.parse(line);

          switch (event.type) {
            case "init":
              total = event.total;
              setPhase("fetching");
              setStatusText(`Fetching 0 of ${total} monsters...`);
              break;

            case "progress":
              setStatusText(
                `Fetching ${event.fetched} of ${event.total} monsters...`,
              );
              // 0→90 during fetching, 90→100 reserved for commit
              setProgress(Math.round((event.fetched / event.total) * 90));
              break;

            case "committing":
              setPhase("committing");
              setProgress(92);
              setStatusText("Uploading to community database...");
              break;

            case "done": {
              const personal: MonsterDexData = {
                lastUpdated: event.lastUpdated,
                totalDiscoveries: event.totalDiscoveries,
                totalMonsters: event.totalMonsters,
                monsters: event.monsters,
              };
              savePersonalSyncData(personal);
              recordSyncTime();
              setPersonalData(personal);
              setProgress(100);
              setPhase("done");
              const failedNote =
                event.totalFailed > 0 ? ` (${event.totalFailed} failed)` : "";
              const communityNote = event.communityError
                ? ` Community upload failed: ${event.communityError}`
                : event.communityUpdated
                  ? " Community database updated!"
                  : "";
              setSuccessText(
                `Synced ${event.monsters.length} monsters.${failedNote}${communityNote}`,
              );
              break;
            }

            case "error":
              setError(event.error);
              setPhase("idle");
              break;
          }
        }
      }
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
    canSync: isAuthenticated && !syncing && minutesLeft === 0,
    minutesUntilSync: minutesLeft,
    sync,
  };
}
