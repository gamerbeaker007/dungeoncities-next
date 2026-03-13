"use client";

import { useCallback, useMemo, useState } from "react";

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

/** Full lock state hook — use this when you manage multiple items (shop, forge list). */
export function useLockItems() {
  const [lockedItemsMap, setLockedItemsMap] = useState<
    Map<number, LockedItemData>
  >(() => getLockedItemsMap());

  // No need for useEffect to set initial state

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
      setLockedItemsMap((prev) => {
        const next = new Map(prev);
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
        saveLockedItemsMap(next);
        return next;
      });
    },
    [],
  );

  const clearAllLocks = useCallback(() => {
    const empty = new Map<number, LockedItemData>();
    saveLockedItemsMap(empty);
    setLockedItemsMap(empty);
  }, []);

  return { lockedItemIds, lockedItems, toggleLock, clearAllLocks };
}
