"use client";

import {
  getAllMarketListingsAction,
  getGameStateAction,
  getMarketplaceListingsAction,
} from "@/actions/game-actions";
import { moveToMarketplace } from "@/lib/location";
import { useAuth } from "@/providers/auth-provider";
import type {
  DCGetMarketplaceListingsParams,
  DCMarketplaceListing,
} from "@/types/dc/marketplace";
import type { DCGameInventoryItem, DCMarketListing } from "@/types/dc/state";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  drubbleBalance: number | null;
  locationWarning: string | null;
  playerLoading: boolean;
  playerError: string | null;
  fetchPlayerItems: () => Promise<void>;

  // ── Marketplace listings (fetchListings) ──────────────────────────────────
  listings: DCMarketplaceListing[] | null;
  total: number;
  hasMore: boolean;
  listingsLoading: boolean;
  listingsError: string | null;
  searchListings: (params: DCGetMarketplaceListingsParams) => Promise<void>;
  loadMore: () => void;
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
  const [drubbleBalance, setDrubbleBalance] = useState<number | null>(null);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // ── Listings state ────────────────────────────────────────────────────────
  const LIMIT = 50;
  const [listings, setListings] = useState<DCMarketplaceListing[] | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const paramsRef = useRef<
    Omit<DCGetMarketplaceListingsParams, "limit" | "offset">
  >({
    sortBy: "price_asc",
  });
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);

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
    setDrubbleBalance(null);

    try {
      const state = await getGameStateAction(token);
      if (!state) throw new Error("Failed to load game state");

      setInventory(state.requiredData?.inventory ?? []);

      const drWallet = state.requiredData?.wallets?.find(
        (w) => w.currencyType === "DRUBBLE",
      );
      const rawBalance = drWallet?.balance;
      setDrubbleBalance(
        rawBalance === undefined ? null : Number.parseFloat(rawBalance) || null,
      );

      const currentLocation = state.state;
      const locationError = await moveToMarketplace(token, currentLocation);
      if (locationError) {
        setLocationWarning(locationError);
        return;
      }

      // Fetch listed and expired in parallel since they're independent.
      // After a location change the API may need a moment, so retry up
      // to 2 times with a short delay between attempts.
      const fetchListings = async () => {
        const [listed, expired] = await Promise.all([
          getAllMarketListingsAction(token, { status: "LISTED", limit: 50 }),
          getAllMarketListingsAction(token, { status: "EXPIRED", limit: 50 }),
        ]);
        return { listed, expired };
      };

      let result = await fetchListings();
      for (let attempt = 0; attempt < 2; attempt++) {
        if (result.listed && result.expired) break;
        await new Promise((r) => setTimeout(r, 1000));
        result = await fetchListings();
      }

      setListed(result.listed?.listings ?? []);
      setExpired(result.expired?.listings ?? []);
    } catch (error) {
      console.error("[useMarket] fetchPlayerItems failed", error);
      setPlayerError("Failed to load player market data");
    } finally {
      setPlayerLoading(false);
    }
  }, [isAuthenticated, token]);

  // ── fetchPage (internal) ──────────────────────────────────────────────────
  const fetchPage = useCallback(
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
        setHasMore(result.listings.length === params.limit);
        setListings((prev) => {
          if (!append) return result.listings;
          const seen = new Set((prev ?? []).map((l) => l.listingId));
          const fresh = result.listings.filter((l) => !seen.has(l.listingId));
          return [...(prev ?? []), ...fresh];
        });
      } catch {
        setListingsError("An error occurred while loading listings.");
      } finally {
        isFetchingRef.current = false;
        setListingsLoading(false);
      }
    },
    [token],
  );

  // ── searchListings ────────────────────────────────────────────────────────
  // Starts a new search: resets pagination state and fetches page 0.
  const searchListings = useCallback(
    async (params: DCGetMarketplaceListingsParams) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { limit: _l, offset: _o, ...rest } = params;
      paramsRef.current = rest;
      offsetRef.current = 0;
      isFetchingRef.current = true;
      await fetchPage({ ...rest, limit: LIMIT, offset: 0 });
    },
    [fetchPage],
  );

  // ── loadMore ──────────────────────────────────────────────────────────────
  // Loads the next page. Re-entrancy-safe via isFetchingRef.
  const loadMore = useCallback(() => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const newOffset = offsetRef.current + LIMIT;
    offsetRef.current = newOffset;
    void fetchPage(
      { ...paramsRef.current, limit: LIMIT, offset: newOffset },
      true,
    );
  }, [fetchPage]);

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
    drubbleBalance,
    locationWarning,
    playerLoading,
    playerError,
    fetchPlayerItems,
    listings,
    total,
    hasMore,
    listingsLoading,
    listingsError,
    searchListings,
    loadMore,
  };
}
