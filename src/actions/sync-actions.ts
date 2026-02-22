"use server";

import { getMonsterDetailsData, getMonsterDexData } from "@/lib/dc-api";
import { toNumber } from "@/lib/format-utils";
import {
  createEmptyCombinedMonsterData,
  readCombinedMonsterData,
  writeCombinedMonsterData,
} from "@/lib/supabase-storage";
import { DCMonsterDetail } from "@/types/dc/monster-dex";
import { ItemDrop, MonsterDexData, MonsterRecord } from "@/types/monter";

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


function mapToMonsterRecord(detail: DCMonsterDetail): MonsterRecord {
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

    // Personal stats (all optional, may be missing if API changes or fields are null)
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
// getCommunityMonsterDataAction
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
// Action 2a: fetchMonsterDetailAction
// Fetches a single monster's details and returns the personal record (which
// includes all community fields via mapToPersonalRecord). Called once per
// monster from the client loop to stay well under the Vercel Hobby 10-second
// serverless function timeout.
// ---------------------------------------------------------------------------

export type FetchMonsterDetailResult =
  | { success: true; record: MonsterRecord }
  | ActionError;

export async function fetchMonsterDetailAction(
  token: string,
  monsterId: number,
): Promise<FetchMonsterDetailResult> {
  if (!token) return { success: false, error: "Not authenticated." };
  try {
    const detail = await getMonsterDetailsData({ token }, monsterId);
    if (!detail?.success || !detail?.data) {
      return { success: false, error: "Detail response missing success/data." };
    }
    return { success: true, record: mapToMonsterRecord(detail.data) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Action 2b: commitSyncAction
// Merges personal records (which include all community fields) into the
// Supabase combined JSON. Called once after all per-monster fetches complete.
// Stays fast (single Supabase read+write).
// ---------------------------------------------------------------------------

export type CommitSyncResult =
  | { success: true; communityUpdated: boolean }
  | (ActionError & { communityUpdated: false });

export async function commitSyncAction(
  personalRecords: MonsterRecord[],
  totalMonstersInGame: number,
  totalDiscoveries: number,
): Promise<CommitSyncResult> {
  try {
    const combined =
      (await readCombinedMonsterData()) ?? createEmptyCombinedMonsterData();
    const { data: merged, changed } = mergeCombinedData(
      combined,
      personalRecords,
      totalMonstersInGame,
      totalDiscoveries,
    );
    if (changed) {
      await writeCombinedMonsterData(merged);
    }
    return { success: true, communityUpdated: changed };
  } catch (err) {
    return {
      success: false,
      communityUpdated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
