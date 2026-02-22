// ---------------------------------------------------------------------------
// Rate-limit helpers (localStorage)
// ---------------------------------------------------------------------------

const RATE_LIMIT_KEY = "dc_sync_last_at";
const RATE_LIMIT_HOURS = 1;

export function getLastSyncTime(): Date | null {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return null;
    return new Date(raw);
  } catch {
    return null;
  }
}

const syncTimeListeners = new Set<() => void>();

export function subscribeSyncTime(cb: () => void): () => void {
  syncTimeListeners.add(cb);
  return () => syncTimeListeners.delete(cb);
}

export function recordSyncTime(): void {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, new Date().toISOString());
    syncTimeListeners.forEach((cb) => cb());
  } catch {
    /* ignore */
  }
}

export function canSyncNow(): boolean {
  const last = getLastSyncTime();
  if (!last) return true;
  const diffMs = Date.now() - last.getTime();
  return diffMs >= RATE_LIMIT_HOURS * 60 * 60 * 1000;
}

export function minutesUntilNextSync(): number {
  const last = getLastSyncTime();
  if (!last) return 0;
  const nextAt = last.getTime() + RATE_LIMIT_HOURS * 60 * 60 * 1000;
  const remaining = Math.max(0, nextAt - Date.now());
  return Math.ceil(remaining / 60_000);
}

// ---------------------------------------------------------------------------
// Personal sync data helpers (localStorage)
// ---------------------------------------------------------------------------

const PERSONAL_KEY = "dc_personal_sync";

export function loadPersonalSyncData() {
  try {
    const raw = localStorage.getItem(PERSONAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as import("@/types/monter").MonsterDexData;
  } catch {
    return null;
  }
}

export function savePersonalSyncData(
  data: import("@/types/monter").MonsterDexData,
): void {
  try {
    localStorage.setItem(PERSONAL_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}
