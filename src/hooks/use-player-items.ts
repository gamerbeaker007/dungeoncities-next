"use client";

import {
  getAllMarketListingsAction,
  getGameStateAction,
} from "@/actions/game-actions";
import { useAuth } from "@/providers/auth-provider";
import { DCGameInventoryItem, DCMarketListing } from "@/types/dc/state";
import { useCallback, useEffect, useMemo, useState } from "react";

export type PlayerItemQuantityBreakdown = {
  inventory: number;
  listed: number;
  expired: number;
  total: number;
};

type UsePlayerItemsResult = {
  inventory: DCGameInventoryItem[];
  listed: DCMarketListing[];
  expired: DCMarketListing[];
  itemQuantitiesByItemId: Record<number, PlayerItemQuantityBreakdown>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

function toItemQuantityMap<T extends { itemId: number; quantity: number }>(
  items: T[],
): Record<number, number> {
  return items.reduce<Record<number, number>>((accumulator, item) => {
    if (!item.itemId || item.quantity <= 0) {
      return accumulator;
    }

    accumulator[item.itemId] = (accumulator[item.itemId] ?? 0) + item.quantity;
    return accumulator;
  }, {});
}

export function usePlayerItems(): UsePlayerItemsResult {
  const { isAuthenticated, token } = useAuth();
  const [inventory, setInventory] = useState<DCGameInventoryItem[]>([]);
  const [listed, setListed] = useState<DCMarketListing[]>([]);
  const [expired, setExpired] = useState<DCMarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setInventory([]);
      setListed([]);
      setExpired([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [state, listedResponse, expiredResponse] = await Promise.all([
        getGameStateAction(token),
        getAllMarketListingsAction(token, { status: "LISTED", limit: 50 }),
        getAllMarketListingsAction(token, { status: "EXPIRED", limit: 50 }),
      ]);

      setInventory(state?.requiredData?.inventory ?? []);
      setListed(listedResponse?.listings ?? []);
      setExpired(expiredResponse?.listings ?? []);
    } catch {
      setInventory([]);
      setListed([]);
      setExpired([]);
      setError("Failed to load player items");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const itemQuantitiesByItemId = useMemo(() => {
    const inventoryByItemId = toItemQuantityMap(inventory);
    const listedByItemId = toItemQuantityMap(listed);
    const expiredByItemId = toItemQuantityMap(expired);

    const itemIds = new Set<number>([
      ...Object.keys(inventoryByItemId).map(Number),
      ...Object.keys(listedByItemId).map(Number),
      ...Object.keys(expiredByItemId).map(Number),
    ]);

    const merged: Record<number, PlayerItemQuantityBreakdown> = {};

    for (const itemId of itemIds) {
      const inventoryQuantity = inventoryByItemId[itemId] ?? 0;
      const listedQuantity = listedByItemId[itemId] ?? 0;
      const expiredQuantity = expiredByItemId[itemId] ?? 0;

      merged[itemId] = {
        inventory: inventoryQuantity,
        listed: listedQuantity,
        expired: expiredQuantity,
        total: inventoryQuantity + listedQuantity + expiredQuantity,
      };
    }

    return merged;
  }, [expired, inventory, listed]);

  return {
    inventory,
    listed,
    expired,
    itemQuantitiesByItemId,
    isLoading,
    error,
    refresh,
  };
}
