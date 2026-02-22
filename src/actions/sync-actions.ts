"use server";

import { getMonsterDetailsData, getMonsterDexData } from "@/lib/dc-api";
import { toNumber } from "@/lib/format-utils";
import {
  createEmptyCombinedMonsterData,
  readCombinedMonsterData,
  writeCombinedMonsterData,
} from "@/lib/supabase-storage";
import { DCMonsterDetail } from "@/types/dc/monster-dex";
import {
  ItemDrop,
  MonsterDexData,
  MonsterRecord,
  SyncProgressEvent,
} from "@/types/monter";

// ---------------------------------------------------------------------------
// Configurable request delay between monster-detail API calls (ms).
// The client passes this through; falls back to this default.
// ---------------------------------------------------------------------------
const DEFAULT_REQUEST_DELAY_MS = 1000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Internal helpers (shared across actions)
// ---------------------------------------------------------------------------

function deriveItemNameFromImageUrl(
  imageUrl: string | null | undefined,
): string | null {
  if (!imageUrl) return null;
  let fileName = "";
  try {
    const url = new URL(imageUrl);
    fileName = url.pathname.split("/").pop() ?? "";
  } catch {
    fileName = imageUrl.split("/").pop() ?? "";
  }
  const withoutExtension = decodeURIComponent(fileName)
    .replace(/\.[^/.]+$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[\-_]+/g, " ")
    .trim();
  if (!withoutExtension) return null;
  return withoutExtension
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function mapDropsFromDetail(detail: DCMonsterDetail): ItemDrop[] {
  const drops = Array.isArray(detail.drops) ? detail.drops : [];
  return drops.map((drop) => {
    const apiItemName = drop.item?.name ?? "???";
    const hasPlaceholderName = apiItemName.trim() === "???";
    const derivedItemName = deriveItemNameFromImageUrl(drop.item?.imageUrl);
    return {
      itemId: drop.itemId,
      itemName: apiItemName,
      derivedItemName,
      itemNameWarning: hasPlaceholderName,
      itemClass: drop.item?.class ?? "Unknown",
      itemImageUrl: drop.item?.imageUrl ?? "",
      dropChance: toNumber(drop.dropChance),
      minQuantity: toNumber(drop.minQuantity),
      maxQuantity: toNumber(drop.maxQuantity),
      bossDrop: Boolean(drop.bossDrop),
      unlocked: Boolean(drop.unlocked),
    };
  });
}

function mapToCommunityRecord(detail: DCMonsterDetail): MonsterRecord {
  return {
    monsterId: detail.monster.monsterId,
    monsterName: detail.monster.name,
    monsterType: detail.monster.type,
    monsterClass: detail.monster.class,
    monsterImageUrl: detail.monster.imageUrl,
    floor: detail.floorInfo
      ? {
          floorId: detail.floorInfo.floorId,
          name: detail.floorInfo.name,
          floorNumber: detail.floorInfo.floorNumber,
          class: detail.floorInfo.class,
        }
      : undefined,
    drops: mapDropsFromDetail(detail),
  };
}

function mapToPersonalRecord(detail: DCMonsterDetail): MonsterRecord {
  return {
    ...mapToCommunityRecord(detail),
    totalEncounters: detail.totalEncounters,
    totalKills: detail.totalKills,
    totalDefeats: detail.totalDefeats,
    totalBossEncounters: detail.totalBossEncounters,
    totalBossKills: detail.totalBossKills,
    totalBossDefeats: detail.totalBossDefeats,
    firstEncounter: {
      encounteredAt: detail.firstEncounteredAt,
      dungeonId: detail.firstEncounteredDungeonId,
      dungeonName: detail.dungeonInfo?.name ?? "Unknown",
      floorNumber:
        detail.floorInfo?.floorNumber ?? detail.firstEncounteredFloor,
      floorName: detail.floorInfo?.name ?? "Unknown",
    },
  };
}

// ---------------------------------------------------------------------------
// Merge logic (community combined JSON)
// ---------------------------------------------------------------------------

function mergeDrops(
  existing: ItemDrop[],
  playerDrops: ItemDrop[],
): { merged: ItemDrop[]; changed: boolean } {
  const byId = new Map<number, ItemDrop>(existing.map((d) => [d.itemId, d]));
  let changed = false;

  for (const playerDrop of playerDrops) {
    const current = byId.get(playerDrop.itemId);

    if (!current) {
      byId.set(playerDrop.itemId, playerDrop);
      changed = true;
      continue;
    }

    let updated = { ...current };
    let dropChanged = false;

    if (!current.unlocked && playerDrop.unlocked) {
      updated = { ...updated, unlocked: true };
      dropChanged = true;
    }

    if (
      (current.itemNameWarning || current.itemName.trim() === "???") &&
      !playerDrop.itemNameWarning &&
      playerDrop.itemName.trim() !== "???"
    ) {
      updated = {
        ...updated,
        itemName: playerDrop.itemName,
        derivedItemName: playerDrop.derivedItemName,
        itemNameWarning: false,
      };
      dropChanged = true;
    }

    if (current.dropChance === 0 && playerDrop.dropChance > 0) {
      updated = { ...updated, dropChance: playerDrop.dropChance };
      dropChanged = true;
    }
    if (current.minQuantity === 0 && playerDrop.minQuantity > 0) {
      updated = {
        ...updated,
        minQuantity: playerDrop.minQuantity,
        maxQuantity: playerDrop.maxQuantity,
      };
      dropChanged = true;
    }

    if (dropChanged) {
      byId.set(playerDrop.itemId, updated);
      changed = true;
    }
  }

  return { merged: Array.from(byId.values()), changed };
}

function mergeCombinedData(
  combined: MonsterDexData,
  communityRecords: MonsterRecord[],
  totalMonstersInGame: number,
  totalDiscoveries: number,
): { data: MonsterDexData; changed: boolean } {
  const byId = new Map<number, MonsterRecord>(
    combined.monsters.map((m) => [m.monsterId, m]),
  );
  let changed = false;

  for (const record of communityRecords) {
    const existing = byId.get(record.monsterId);

    if (!existing) {
      byId.set(record.monsterId, record);
      changed = true;
      continue;
    }

    const { merged, changed: dropsChanged } = mergeDrops(
      existing.drops,
      record.drops,
    );

    let updated = existing;

    if (dropsChanged) {
      updated = { ...updated, drops: merged };
      changed = true;
    }

    if (!existing.floor && record.floor) {
      updated = { ...updated, floor: record.floor };
      changed = true;
    }

    if (updated !== existing) {
      byId.set(record.monsterId, updated);
    }
  }

  const newData: MonsterDexData = {
    ...combined,
    monsters: Array.from(byId.values()),
    totalMonsters: Math.max(totalMonstersInGame, combined.totalMonsters),
    totalDiscoveries: Math.max(totalDiscoveries, combined.totalDiscoveries),
    lastUpdated: changed ? new Date().toISOString() : combined.lastUpdated,
  };

  return { data: newData, changed };
}

// ---------------------------------------------------------------------------
// Shared result shape
// ---------------------------------------------------------------------------

type ActionError = { success: false; error: string };

// ---------------------------------------------------------------------------
// Action 0: getCommunityMonsterDataAction
// Reads the current community combined.json from Supabase.
// If it doesn't exist yet, creates an empty one and returns it.
// Used by useCommunityMonsterDex to avoid browser-side Supabase calls.
// ---------------------------------------------------------------------------

export async function getCommunityMonsterDataAction(): Promise<MonsterDexData | null> {
  try {
    const existing = await readCombinedMonsterData();
    if (existing !== null) return existing;

    const empty = createEmptyCombinedMonsterData();
    await writeCombinedMonsterData(empty);
    return empty;
  } catch (err) {
    console.error("[getCommunityMonsterDataAction]", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Action 1: initSyncAction
// Fetches the monster dex and returns the list of monster IDs to fetch.
// ---------------------------------------------------------------------------

export type InitSyncResult =
  | {
      success: true;
      monsterIds: number[];
      totalMonstersInGame: number;
      totalDiscoveries: number;
    }
  | ActionError;

export async function initSyncAction(token: string): Promise<InitSyncResult> {
  if (!token) return { success: false, error: "Not authenticated." };

  try {
    const dexResponse = await getMonsterDexData({ token });

    if (!dexResponse?.success) {
      return { success: false, error: "Monster dex returned success=false." };
    }

    const discoveries = Array.isArray(dexResponse.data?.discoveries)
      ? dexResponse.data.discoveries
      : [];

    const monsterIds = [
      ...new Set(
        discoveries
          .map((d) => d.monsterId)
          .filter((id): id is number => Number.isFinite(id)),
      ),
    ];

    return {
      success: true,
      monsterIds,
      totalMonstersInGame: dexResponse.data?.totalMonstersInGame ?? 0,
      totalDiscoveries: discoveries.length,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to fetch monster dex: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Action 2b: runFullSyncAction
// Runs the full sync flow server-side (init → fetch all monsters → commit) and
// streams SyncProgressEvent JSON lines back to the client via a ReadableStream.
// ---------------------------------------------------------------------------

export async function runFullSyncAction(
  token: string,
  delayMs: number = DEFAULT_REQUEST_DELAY_MS,
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SyncProgressEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        // ── Step 1: init ────────────────────────────────────────────────────
        if (!token) {
          send({ type: "error", error: "Not authenticated." });
          controller.close();
          return;
        }

        const dexResponse = await getMonsterDexData({ token });
        if (!dexResponse?.success) {
          send({ type: "error", error: "Monster dex returned success=false." });
          controller.close();
          return;
        }

        const discoveries = Array.isArray(dexResponse.data?.discoveries)
          ? dexResponse.data.discoveries
          : [];
        const monsterIds = [
          ...new Set(
            discoveries
              .map((d) => d.monsterId)
              .filter((id): id is number => Number.isFinite(id)),
          ),
        ];
        const totalMonstersInGame = dexResponse.data?.totalMonstersInGame ?? 0;
        const totalDiscoveries = discoveries.length;
        const total = monsterIds.length;

        send({ type: "init", total });

        // ── Step 2: fetch each monster with delay ────────────────────────────
        const safeDelay = Math.max(
          0,
          Number.isFinite(delayMs) ? delayMs : DEFAULT_REQUEST_DELAY_MS,
        );

        const allCommunityRecords: MonsterRecord[] = []; // for Supabase commit
        const allPersonalRecords: MonsterRecord[] = []; // for localStorage (stats embedded)
        let totalFailed = 0;

        for (let i = 0; i < monsterIds.length; i++) {
          const monsterId = monsterIds[i];

          if (i > 0 && safeDelay > 0) {
            await sleep(safeDelay);
          }

          try {
            const detail = await getMonsterDetailsData({ token }, monsterId);
            if (!detail?.success || !detail?.data) {
              throw new Error("Detail response missing success/data.");
            }
            allCommunityRecords.push(mapToCommunityRecord(detail.data));
            allPersonalRecords.push(mapToPersonalRecord(detail.data));
          } catch (err) {
            totalFailed++;
            console.error(
              `[runFullSyncAction] Failed monsterId=${monsterId}:`,
              err instanceof Error ? err.message : err,
            );
          }

          send({
            type: "progress",
            fetched: i + 1,
            total,
            failed: totalFailed,
          });
        }

        // ── Step 3: commit ───────────────────────────────────────────────────
        send({ type: "committing" });

        let communityError: string | undefined;
        let communityUpdated = false;

        try {
          const combined =
            (await readCombinedMonsterData()) ??
            createEmptyCombinedMonsterData();

          const { data: merged, changed } = mergeCombinedData(
            combined,
            allCommunityRecords,
            totalMonstersInGame,
            totalDiscoveries,
          );
          communityUpdated = changed;

          if (changed) {
            try {
              await writeCombinedMonsterData(merged);
            } catch (err) {
              communityError = err instanceof Error ? err.message : String(err);
              console.error(
                "[runFullSyncAction] Failed to upload combined data:",
                communityError,
              );
            }
          }
        } catch (err) {
          communityError = err instanceof Error ? err.message : String(err);
          console.warn(
            "[runFullSyncAction] Community commit skipped:",
            communityError,
          );
        }

        send({
          type: "done",
          monsters: allPersonalRecords,
          lastUpdated: new Date().toISOString(),
          totalDiscoveries,
          totalMonsters: totalMonstersInGame,
          communityUpdated,
          totalFailed,
          communityError,
        });
        controller.close();
      } catch (err) {
        send({
          type: "error",
          error:
            err instanceof Error
              ? err.message
              : "Sync failed. Please try again.",
        });
        controller.close();
      }
    },
  });
}
