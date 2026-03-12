"use client";

import { getGameStateAction, sellItemAction } from "@/actions/game-actions";
import { moveToShop } from "@/lib/location";
import { useAuth } from "@/providers/auth-provider";
import type { DCGameInventoryItem } from "@/types/dc/state";
import type { DCSellItemResponse } from "@/types/dc/shop";
import { useCallback, useEffect, useState } from "react";

const LOCKED_ITEMS_KEY = "dc_shop_locked_items";

function getLockedItemIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LOCKED_ITEMS_KEY);
    if (!raw) return new Set();
    const parsed: number[] = JSON.parse(raw);
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveLockedItemIds(ids: Set<number>) {
  localStorage.setItem(LOCKED_ITEMS_KEY, JSON.stringify([...ids]));
}

export type SellResult = {
  inventoryId: string;
  itemName: string;
  success: boolean;
  message: string;
  totalValue?: number;
};

type UseShopResult = {
  inventory: DCGameInventoryItem[];
  drubbleBalance: number | null;
  locationWarning: string | null;
  loading: boolean;
  error: string | null;
  selling: boolean;
  sellResults: SellResult[];
  lockedItemIds: Set<number>;
  selectedItemIds: Set<string>;
  fetchShopData: () => Promise<void>;
  toggleLock: (itemId: number) => void;
  toggleSelect: (characterInventoryId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  sellSelected: () => Promise<void>;
  sellAll: () => Promise<void>;
  clearSellResults: () => void;
};

export function useShop(): UseShopResult {
  const { isAuthenticated, token } = useAuth();

  const [inventory, setInventory] = useState<DCGameInventoryItem[]>([]);
  const [drubbleBalance, setDrubbleBalance] = useState<number | null>(null);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selling, setSelling] = useState(false);
  const [sellResults, setSellResults] = useState<SellResult[]>([]);
  const [lockedItemIds, setLockedItemIds] = useState<Set<number>>(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );

  // Load locked items from localStorage on mount
  useEffect(() => {
    setLockedItemIds(getLockedItemIds());
  }, []);

  const fetchShopData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setInventory([]);
      setError(null);
      setLocationWarning(null);
      return;
    }

    setLoading(true);
    setError(null);
    setLocationWarning(null);

    try {
      const state = await getGameStateAction(token);
      if (!state) throw new Error("Failed to load game state");

      const allItems = state.requiredData?.inventory ?? [];
      setInventory(allItems.filter((i) => i.item.sellable && !i.equipped));

      const drWallet = state.requiredData?.wallets?.find(
        (w) => w.currencyType === "DRUBBLE",
      );
      const rawBalance = drWallet?.balance;
      setDrubbleBalance(
        rawBalance === undefined ? null : Number.parseFloat(rawBalance) || 0,
      );

      const currentLocation = state.state;

      const locationError = await moveToShop(token, currentLocation);
      if (locationError) {
        setLocationWarning(locationError);
        return;
      }
    } catch (err) {
      console.error("[useShop] fetchShopData failed", err);
      setError("Failed to load shop data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    void fetchShopData();
  }, [fetchShopData]);

  const toggleLock = useCallback(
    (itemId: number) => {
      const wasLocked = lockedItemIds.has(itemId);
      setLockedItemIds((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        saveLockedItemIds(next);
        return next;
      });
      // Deselect all inventory entries for this itemId when locking
      if (!wasLocked) {
        setSelectedItemIds((prev) => {
          const idsToRemove = inventory
            .filter((i) => i.itemId === itemId)
            .map((i) => i.id);
          const next = new Set(prev);
          for (const id of idsToRemove) {
            next.delete(id);
          }
          return next;
        });
      }
    },
    [lockedItemIds, inventory],
  );

  const toggleSelect = useCallback(
    (characterInventoryId: string) => {
      const invItem = inventory.find((i) => i.id === characterInventoryId);
      if (!invItem || lockedItemIds.has(invItem.itemId)) return;
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        if (next.has(characterInventoryId)) {
          next.delete(characterInventoryId);
        } else {
          next.add(characterInventoryId);
        }
        return next;
      });
    },
    [lockedItemIds, inventory],
  );

  const selectAll = useCallback(() => {
    const sellable = inventory.filter(
      (item) => !lockedItemIds.has(item.itemId),
    );
    setSelectedItemIds(new Set(sellable.map((i) => i.id)));
  }, [inventory, lockedItemIds]);

  const deselectAll = useCallback(() => {
    setSelectedItemIds(new Set());
  }, []);

  const sellItems = useCallback(
    async (items: DCGameInventoryItem[]) => {
      if (!token || items.length === 0) return;

      setSelling(true);
      const results: SellResult[] = [];

      for (const invItem of items) {
        const response: DCSellItemResponse | null = await sellItemAction(
          token,
          {
            itemId: invItem.itemId,
            characterInventoryId: invItem.id,
            quantity: invItem.quantity,
          },
        );

        results.push({
          inventoryId: invItem.id,
          itemName: invItem.item.name,
          success: response?.success ?? false,
          message: response?.message ?? response?.error ?? "Failed to sell",
          totalValue: response?.details?.totalValue,
        });
      }

      setSellResults(results);
      setSelling(false);

      // Refresh state to get updated inventory and balance
      await fetchShopData();
      setSelectedItemIds(new Set());
    },
    [token, fetchShopData],
  );

  const sellSelected = useCallback(async () => {
    const items = inventory.filter(
      (item) => selectedItemIds.has(item.id) && !lockedItemIds.has(item.itemId),
    );
    await sellItems(items);
  }, [inventory, selectedItemIds, lockedItemIds, sellItems]);

  const sellAll = useCallback(async () => {
    const items = inventory.filter((item) => !lockedItemIds.has(item.itemId));
    await sellItems(items);
  }, [inventory, lockedItemIds, sellItems]);

  const clearSellResults = useCallback(() => {
    setSellResults([]);
  }, []);

  return {
    inventory,
    drubbleBalance,
    locationWarning,
    loading,
    error,
    selling,
    sellResults,
    lockedItemIds,
    selectedItemIds,
    fetchShopData,
    toggleLock,
    toggleSelect,
    selectAll,
    deselectAll,
    sellSelected,
    sellAll,
    clearSellResults,
  };
}
