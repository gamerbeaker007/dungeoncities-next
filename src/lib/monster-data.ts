// monster-details.json is no longer bundled — all monster data is loaded at
// runtime from Supabase Storage. These functions return empty data so the
// build succeeds; client components populate themselves from the live source.

export function getMonsters() {
  return [] as import("@/types/monter").MonsterRecord[];
}

export function getTotalMonstersInGame() {
  return 0;
}
