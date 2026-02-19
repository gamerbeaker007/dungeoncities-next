"use client";

import { getGameStateAction } from "@/actions/game-actions";
import { useAuth } from "@/providers/auth-provider";
import { DCGameInventoryItem } from "@/types/dc/state";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseInventoryResult = {
  inventory: DCGameInventoryItem[];
  inventoryByItemId: Record<number, number>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useInventory(): UseInventoryResult {
  const { isAuthenticated, token } = useAuth();
  const [inventory, setInventory] = useState<DCGameInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setInventory([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const state = await getGameStateAction(token);
      const inventoryItems = state?.requiredData?.inventory ?? [];
      setInventory(inventoryItems);
    } catch {
      setInventory([]);
      setError("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const inventoryByItemId = useMemo(() => {
    return inventory.reduce<Record<number, number>>((accumulator, item) => {
      if (!item.itemId || item.quantity <= 0) {
        return accumulator;
      }

      accumulator[item.itemId] =
        (accumulator[item.itemId] ?? 0) + item.quantity;
      return accumulator;
    }, {});
  }, [inventory]);

  return {
    inventory,
    inventoryByItemId,
    isLoading,
    error,
    refresh,
  };
}
