"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const LOCKED_ITEMS_KEY = "dc_shop_locked_items";

export type LockedItemData = {
  itemId: number;
  name: string;
  imageUrl: string;
  category: string;
};

export function getLockedItemsMap(): Map<number, LockedItemData> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = localStorage.getItem(LOCKED_ITEMS_KEY);
    if (!raw) return new Map();
    const parsed: (LockedItemData | number)[] = JSON.parse(raw);
    const map = new Map<number, LockedItemData>();
    for (const entry of parsed) {
      // Handle legacy format (just numbers)
      if (typeof entry === "number") {
        map.set(entry, {
          itemId: entry,
          name: `Item #${entry}`,
          imageUrl: "",
          category: "",
        });
      } else {
        map.set(entry.itemId, entry);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

export function saveLockedItemsMap(map: Map<number, LockedItemData>) {
  localStorage.setItem(LOCKED_ITEMS_KEY, JSON.stringify([...map.values()]));
}

// ---------------------------------------------------------------------------
// Module-level store — shared across all useLockItems hook instances
// ---------------------------------------------------------------------------
const _emptyMap = new Map<number, LockedItemData>();
let _cache: Map<number, LockedItemData> | null = null;
const _listeners = new Set<() => void>();

function _getStore(): Map<number, LockedItemData> {
  if (_cache === null) {
    _cache = getLockedItemsMap();
  }
  return _cache;
}

function _setStore(map: Map<number, LockedItemData>) {
  _cache = map;
  saveLockedItemsMap(map);
  _listeners.forEach((l) => l());
}

function _subscribe(callback: () => void) {
  _listeners.add(callback);
  return () => _listeners.delete(callback);
}

/** Full lock state hook — use this when you manage multiple items (shop, forge list). */
export function useLockItems() {
  // useSyncExternalStore handles SSR (server snapshot = empty Map) and client
  // hydration correctly without needing useEffect + setState.
  const lockedItemsMap = useSyncExternalStore(
    _subscribe,
    _getStore,
    () => _emptyMap,
  );

  const lockedItemIds = useMemo(
    () => new Set(lockedItemsMap.keys()),
    [lockedItemsMap],
  );
  const lockedItems = useMemo(
    () => [...lockedItemsMap.values()],
    [lockedItemsMap],
  );

  const toggleLock = useCallback(
    (itemId: number, itemData?: LockedItemData) => {
      const next = new Map(_getStore());
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.set(
          itemId,
          itemData ?? {
            itemId,
            name: `Item #${itemId}`,
            imageUrl: "",
            category: "",
          },
        );
      }
      _setStore(next);
    },
    [],
  );

  const clearAllLocks = useCallback(() => {
    _setStore(new Map<number, LockedItemData>());
  }, []);

  return { lockedItemIds, lockedItems, toggleLock, clearAllLocks };
}
