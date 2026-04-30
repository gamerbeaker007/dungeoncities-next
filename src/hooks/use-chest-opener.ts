"use client";

import {
  collectChestDropsAction,
  getGameStateAction,
  getInventoryStatusAction,
  openChestAction,
  updateLocationAction,
} from "@/actions/game-actions";
import { useAuth } from "@/providers/auth-provider";
import type { DCGameInventoryItem } from "@/types/dc/state";
import { useCallback, useEffect, useState } from "react";

export type DropSummaryEntry = {
  name: string;
  count: number;
  class: string;
  imageUrl: string;
};

export type ChestInventoryItem = {
  id: string;
  itemId: number;
  name: string;
  imageUrl: string;
  class: string;
  quantity: number;
};

type UseChestOpenerResult = {
  loading: boolean;
  opening: boolean;
  error: string | null;
  locationWarning: string | null;
  chestsToOpen: ChestInventoryItem[];
  excludedChests: ChestInventoryItem[];
  availableSpace: number | null;
  totalSpace: number | null;
  usedSpace: number | null;
  dropSummary: DropSummaryEntry[];
  chestsOpened: number;
  minSpaceBuffer: number;
  fetchData: () => Promise<void>;
  openAll: () => Promise<void>;
  clearSummary: () => void;
};

const MIN_SPACE_BUFFER = 5;

function isChest(item: DCGameInventoryItem): boolean {
  return item.item.name.toLowerCase().includes("chest");
}

function isCoreChest(item: DCGameInventoryItem): boolean {
  return item.item.name.toLowerCase().includes("core chest");
}

function buildChestList(inventory: DCGameInventoryItem[]): {
  toOpen: ChestInventoryItem[];
  excluded: ChestInventoryItem[];
} {
  const chestItems = inventory.filter(isChest);
  return {
    toOpen: chestItems
      .filter((i) => !isCoreChest(i))
      .map((i) => ({
        id: i.id,
        itemId: i.itemId,
        name: i.item.name,
        imageUrl: i.item.imageUrl,
        class: i.item.class,
        quantity: i.quantity,
      })),
    excluded: chestItems.filter(isCoreChest).map((i) => ({
      id: i.id,
      itemId: i.itemId,
      name: i.item.name,
      imageUrl: i.item.imageUrl,
      class: i.item.class,
      quantity: i.quantity,
    })),
  };
}

export function useChestOpener(): UseChestOpenerResult {
  const { isAuthenticated, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const [chestsToOpen, setChestsToOpen] = useState<ChestInventoryItem[]>([]);
  const [excludedChests, setExcludedChests] = useState<ChestInventoryItem[]>(
    [],
  );
  const [availableSpace, setAvailableSpace] = useState<number | null>(null);
  const [totalSpace, setTotalSpace] = useState<number | null>(null);
  const [usedSpace, setUsedSpace] = useState<number | null>(null);
  const [dropSummary, setDropSummary] = useState<DropSummaryEntry[]>([]);
  const [chestsOpened, setChestsOpened] = useState(0);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setChestsToOpen([]);
      setExcludedChests([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setLocationWarning(null);

    try {
      const state = await getGameStateAction(token);
      if (!state) throw new Error("Failed to load game state");

      const currentLocation = state.state;
      if (
        currentLocation === "IN_DUNGEON" ||
        currentLocation === "ENTERING_DUNGEON" ||
        currentLocation === "IN_COMBAT"
      ) {
        setLocationWarning(
          "You are currently in a dungeon or combat. Please exit manually first.",
        );
        setLoading(false);
        return;
      }

      // Must be IN_CITY for GET_INVENTORY_STATUS to work
      if (currentLocation !== "IN_CITY") {
        const moveResult = await updateLocationAction(token, "IN_CITY");
        if (!moveResult?.success) {
          setLocationWarning(`Unable to move to city from: ${currentLocation}`);
          setLoading(false);
          return;
        }
      }

      const { toOpen, excluded } = buildChestList(
        state.requiredData?.inventory ?? [],
      );
      setChestsToOpen(toOpen);
      setExcludedChests(excluded);

      const status = await getInventoryStatusAction(token);
      if (status) {
        setAvailableSpace(status.availableSpace);
        setTotalSpace(status.totalSpace);
        setUsedSpace(status.usedSpace);
      }
    } catch (err) {
      console.error("[useChestOpener] fetchData failed", err);
      setError("Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const openAll = useCallback(async () => {
    if (!token) return;

    setOpening(true);
    setError(null);

    try {
      // Ensure IN_CITY
      const initialState = await getGameStateAction(token);
      if (!initialState) throw new Error("Failed to load game state");

      const currentLocation = initialState.state;
      if (
        currentLocation === "IN_DUNGEON" ||
        currentLocation === "ENTERING_DUNGEON" ||
        currentLocation === "IN_COMBAT"
      ) {
        setLocationWarning(
          "You are currently in a dungeon or combat. Please exit manually first.",
        );
        return;
      }

      if (currentLocation !== "IN_CITY") {
        const moveResult = await updateLocationAction(token, "IN_CITY");
        if (!moveResult?.success) {
          setLocationWarning(`Unable to move to city from: ${currentLocation}`);
          return;
        }
      }

      // Get initial inventory status
      const statusResult = await getInventoryStatusAction(token);
      let currentAvailableSpace = statusResult?.availableSpace ?? 0;
      setAvailableSpace(currentAvailableSpace);
      setTotalSpace(statusResult?.totalSpace ?? null);
      setUsedSpace(statusResult?.usedSpace ?? null);

      // Accumulate summary across all passes (chests can drop more chests)
      const summaryMap = new Map<string, DropSummaryEntry>();
      let totalOpened = 0;

      let currentInventory = initialState.requiredData?.inventory ?? [];

      // Loop: open chests, then re-scan for newly dropped chests
      while (currentAvailableSpace > MIN_SPACE_BUFFER) {
        const { toOpen, excluded } = buildChestList(currentInventory);
        setExcludedChests(excluded);

        if (toOpen.length === 0) break;

        setChestsToOpen(toOpen);

        let openedInThisPass = false;

        for (const chest of toOpen) {
          for (let qty = 0; qty < chest.quantity; qty++) {
            if (currentAvailableSpace <= MIN_SPACE_BUFFER) break;

            const openResult = await openChestAction(
              token,
              chest.itemId,
              chest.id,
            );
            if (!openResult?.success) continue;

            const drops = openResult.drops ?? [];
            const collectResult = await collectChestDropsAction(token, drops);
            if (!collectResult?.success) continue;

            totalOpened++;
            openedInThisPass = true;

            // Accumulate drops into summary
            for (const drop of drops) {
              const existing = summaryMap.get(drop.name);
              if (existing) {
                existing.count += drop.quantity;
              } else {
                summaryMap.set(drop.name, {
                  name: drop.name,
                  count: drop.quantity,
                  class: drop.class,
                  imageUrl: drop.imageUrl,
                });
              }
            }

            // Update space after collecting
            const postStatus = await getInventoryStatusAction(token);
            if (postStatus) {
              currentAvailableSpace = postStatus.availableSpace;
              setAvailableSpace(postStatus.availableSpace);
              setTotalSpace(postStatus.totalSpace);
              setUsedSpace(postStatus.usedSpace);
            }

            // Update summary reactively after each chest
            setDropSummary(
              [...summaryMap.values()].sort((a, b) =>
                a.name.localeCompare(b.name),
              ),
            );
            setChestsOpened(totalOpened);
          }

          if (currentAvailableSpace <= MIN_SPACE_BUFFER) break;
        }

        if (!openedInThisPass || currentAvailableSpace <= MIN_SPACE_BUFFER)
          break;

        // Re-scan inventory for chests received as drops
        const refreshedState = await getGameStateAction(token);
        if (!refreshedState) break;
        currentInventory = refreshedState.requiredData?.inventory ?? [];
      }

      // Final refresh to sync UI
      await fetchData();
    } catch (err) {
      console.error("[useChestOpener] openAll failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while opening chests.",
      );
    } finally {
      setOpening(false);
    }
  }, [token, fetchData]);

  const clearSummary = useCallback(() => {
    setDropSummary([]);
    setChestsOpened(0);
  }, []);

  return {
    loading,
    opening,
    error,
    locationWarning,
    chestsToOpen,
    excludedChests,
    availableSpace,
    totalSpace,
    usedSpace,
    dropSummary,
    chestsOpened,
    minSpaceBuffer: MIN_SPACE_BUFFER,
    fetchData,
    openAll,
    clearSummary,
  };
}
