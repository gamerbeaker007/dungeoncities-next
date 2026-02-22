/**
 * Supabase Storage helpers for the community combined monster data JSON.
 *
 * Bucket:  monster-data   (public read, authenticated write)
 * File:    combined.json
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL         — Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY    — public anon key (read + public upload via RLS)
 *   SUPABASE_SECRET_KEY        — service role key (server-side writes, bypasses RLS)
 */

import type { MonsterDexData } from "@/types/monter";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "monster-data";
const FILE_PATH = "combined.json";

// ---------------------------------------------------------------------------
// Server-side client (service role — used in Server Actions only)
// ---------------------------------------------------------------------------

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Public URL for the combined JSON (client-readable, CDN-cached)
// ---------------------------------------------------------------------------

export function getCombinedMonsterDataPublicUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  // Standard Supabase Storage public URL pattern
  return `${url}/storage/v1/object/public/${BUCKET}/${FILE_PATH}`;
}

// ---------------------------------------------------------------------------
// Server-side read
// ---------------------------------------------------------------------------

/**
 * Reads the combined monster data JSON from Supabase Storage.
 * Returns null if the file does not exist yet.
 */
export async function readCombinedMonsterData(): Promise<MonsterDexData | null> {
  const supabase = getServerClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(FILE_PATH);

  if (error) {
    // Treat any download error as "file not found / doesn't exist yet".
    // The local Supabase dev server returns a JSON object as the error body
    // (e.g. {"url":"..."}) which doesn't contain a useful message string.
    // In production, a genuine auth/permission failure would surface when
    // the *write* path is exercised instead.
    const msg =
      typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : JSON.stringify(error);

    const isPermissionError =
      msg.toLowerCase().includes("permission") ||
      msg.toLowerCase().includes("unauthorized") ||
      msg.toLowerCase().includes("forbidden");

    if (isPermissionError) {
      throw new Error(`Supabase storage permission error: ${msg}`);
    }

    // Treat all other errors (404, object-not-found, network quirks on local) as "not found"
    console.warn(
      "[supabase-storage] readCombinedMonsterData: treating as not found —",
      msg,
    );
    return null;
  }

  const text = await data.text();
  return JSON.parse(text) as MonsterDexData;
}

// ---------------------------------------------------------------------------
// Server-side write
// ---------------------------------------------------------------------------

/**
 * Writes the combined monster data JSON to Supabase Storage.
 * Upserts the file (creates or replaces).
 */
export async function writeCombinedMonsterData(
  data: MonsterDexData,
): Promise<void> {
  const supabase = getServerClient();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(FILE_PATH, blob, {
      upsert: true,
      contentType: "application/json",
      cacheControl: "300", // 5-minute CDN cache
    });

  if (error) {
    throw new Error(
      `Supabase write error: ${(error as { message?: string }).message ?? String(error)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Empty combined data factory
// ---------------------------------------------------------------------------

export function createEmptyCombinedMonsterData(): MonsterDexData {
  return {
    lastUpdated: new Date().toISOString(),
    totalDiscoveries: 0,
    totalMonsters: 0,
    monsters: [],
  };
}
