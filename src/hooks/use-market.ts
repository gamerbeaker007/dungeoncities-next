"use client";

import {
  getAllMarketListingsAction,
  getGameStateAction,
  getMarketplaceListingsAction,
  updateLocationAction,
} from "@/actions/game-actions";
import { useAuth } from "@/providers/auth-provider";
import type {
  DCGetMarketplaceListingsParams,
  DCMarketplaceListing,
} from "@/types/dc/marketplace";
import type { DCGameInventoryItem, DCMarketListing } from "@/types/dc/state";
import { useCallback, useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlayerItemQuantityBreakdown = {
  inventory: number;
  listed: number;
  expired: number;
  total: number;
};

type UseMarketResult = {
  // ── Player data (fetchPlayerItems) ────────────────────────────────────────
  inventory: DCGameInventoryItem[];
  listed: DCMarketListing[];
  expired: DCMarketListing[];
  itemQuantitiesByItemId: Record<number, PlayerItemQuantityBreakdown>;
  druppleBalance: number | null;
  locationWarning: string | null;
  playerLoading: boolean;
  playerError: string | null;
  fetchPlayerItems: () => Promise<void>;

  // ── Marketplace listings (fetchListings) ──────────────────────────────────
  listings: DCMarketplaceListing[];
  total: number;
  hasFetched: boolean;
  listingsLoading: boolean;
  listingsError: string | null;
  fetchListings: (
    params: DCGetMarketplaceListingsParams,
    append?: boolean,
  ) => Promise<void>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toItemQuantityMap<T extends { itemId: number; quantity: number }>(
  items: T[],
): Record<number, number> {
  return items.reduce<Record<number, number>>((acc, item) => {
    if (!item.itemId || item.quantity <= 0) return acc;
    acc[item.itemId] = (acc[item.itemId] ?? 0) + item.quantity;
    return acc;
  }, {});
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMarket(): UseMarketResult {
  const { isAuthenticated, token } = useAuth();

  // ── Player state ──────────────────────────────────────────────────────────
  const [inventory, setInventory] = useState<DCGameInventoryItem[]>([]);
  const [listed, setListed] = useState<DCMarketListing[]>([]);
  const [expired, setExpired] = useState<DCMarketListing[]>([]);
  const [druppleBalance, setDruppleBalance] = useState<number | null>(null);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // ── Listings state ────────────────────────────────────────────────────────
  const [listings, setListings] = useState<DCMarketplaceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  // ── fetchPlayerItems ──────────────────────────────────────────────────────
  // Checks location, sets locationWarning if not at the marketplace,
  // loads inventory + player's own listings, and extracts DR balance —
  // all from a single getGameStateAction call.
  const fetchPlayerItems = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setInventory([]);
      setListed([]);
      setExpired([]);
      setPlayerError(null);
      setLocationWarning(null);
      return;
    }

    setPlayerLoading(true);
    setPlayerError(null);
    setLocationWarning(null);
    setDruppleBalance(null);

    try {
      const state = await getGameStateAction(token);
      if (!state) throw new Error("Failed to load game state");

      setInventory(state.requiredData?.inventory ?? []);

      const drWallet = state.requiredData?.wallets?.find(
        (w) => w.currencyType === "DRUBBLE",
      );
      const rawBalance = drWallet?.balance;
      setDruppleBalance(
        rawBalance !== undefined ? parseFloat(rawBalance) || null : null,
      );

      const currentLocation = state.state;

      if (currentLocation === "IN_CITY") {
        console.warn("[useMarket] Player is IN_CITY, moving to IN_MARKETPLACE");
        const moveResult = await updateLocationAction(token, "IN_MARKETPLACE");
        if (!moveResult?.success) {
          console.error(
            "[useMarket] Failed to move to IN_MARKETPLACE",
            moveResult,
          );
          setLocationWarning(
            `Unable to fetch market data due to current location: ${currentLocation}`,
          );
          return;
        }
      } else if (currentLocation !== "IN_MARKETPLACE") {
        console.warn(
          "[useMarket] Cannot fetch market data from location:",
          currentLocation,
        );
        setLocationWarning(
          `Unable to fetch market data due to current location: ${currentLocation}`,
        );
        return;
      }

      // Fetch listed and expired in parallel since they're independent
      const [listedResponse, expiredResponse] = await Promise.all([
        getAllMarketListingsAction(token, { status: "LISTED", limit: 50 }),
        getAllMarketListingsAction(token, { status: "EXPIRED", limit: 50 }),
      ]);

      if (!listedResponse)
        throw new Error("Failed to load listed market items");
      if (!expiredResponse)
        throw new Error("Failed to load expired market items");

      setListed(listedResponse.listings);
      setExpired(expiredResponse.listings);
    } catch (error) {
      console.error("[useMarket] fetchPlayerItems failed", error);
      setPlayerError("Failed to load player market data");
    } finally {
      setPlayerLoading(false);
    }
  }, [isAuthenticated, token]);

  // ── fetchListings ─────────────────────────────────────────────────────────
  // Fetches marketplace search results. Pass append=true for load-more.
  const fetchListings = useCallback(
    async (params: DCGetMarketplaceListingsParams, append = false) => {
      if (!token) return;
      setListingsLoading(true);
      setListingsError(null);
      try {
        const result = await getMarketplaceListingsAction(token, params);
        if (!result) {
          setListingsError("Failed to load marketplace listings.");
          return;
        }
        setTotal(result.total);
        setListings((prev) =>
          append ? [...prev, ...result.listings] : result.listings,
        );
        setHasFetched(true);
      } catch {
        setListingsError("An error occurred while loading listings.");
      } finally {
        setListingsLoading(false);
      }
    },
    [token],
  );

  // Auto-load player items on mount / auth change
  useEffect(() => {
    void fetchPlayerItems();
  }, [fetchPlayerItems]);

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
      const inv = inventoryByItemId[itemId] ?? 0;
      const lst = listedByItemId[itemId] ?? 0;
      const exp = expiredByItemId[itemId] ?? 0;
      merged[itemId] = {
        inventory: inv,
        listed: lst,
        expired: exp,
        total: inv + lst + exp,
      };
    }
    return merged;
  }, [inventory, listed, expired]);

  return {
    inventory,
    listed,
    expired,
    itemQuantitiesByItemId,
    druppleBalance,
    locationWarning,
    playerLoading,
    playerError,
    fetchPlayerItems,
    listings,
    total,
    hasFetched,
    listingsLoading,
    listingsError,
    fetchListings,
  };
}
