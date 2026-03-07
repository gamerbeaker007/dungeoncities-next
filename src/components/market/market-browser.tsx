"use client";

import { purchaseItemAction } from "@/actions/game-actions";
import { useMarket } from "@/hooks/use-market";
import { useAuth } from "@/providers/auth-provider";
import type {
  DCGetMarketplaceListingsParams,
  DCMarketplaceSortBy,
} from "@/types/dc/marketplace";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { FilterPane } from "./filter-pane";
import { ItemSection } from "./item-section";

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const LIMIT = 50;

// ---------------------------------------------------------------------------
// Inner component (uses useSearchParams — must be inside Suspense)
// ---------------------------------------------------------------------------

function MarketBrowserContent() {
  const { token, isAuthenticated, username } = useAuth();
  const {
    locationWarning,
    playerLoading,
    druppleBalance,
    listings,
    total,
    hasFetched,
    listingsLoading: loading,
    listingsError: error,
    fetchListings,
  } = useMarket();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";

  // Track current filter params so load-more can repeat them with a new offset
  const paramsRef = useRef<
    Omit<DCGetMarketplaceListingsParams, "limit" | "offset">
  >({ sortBy: "price_asc" as DCMarketplaceSortBy });
  const [offset, setOffset] = useState(0);

  // Wraps the hook's fetchListings: on new searches resets pagination and
  // stores params for load-more; on append (load-more) passes through as-is.
  const applyFetch = useCallback(
    (params: DCGetMarketplaceListingsParams, append = false) => {
      if (!append) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { limit: _limit, offset: _offset, ...rest } = params;
        paramsRef.current = rest;
        setOffset(0);
      }
      return fetchListings(params, append);
    },
    [fetchListings],
  );

  // Auto-load once location is confirmed at IN_MARKETPLACE
  useEffect(() => {
    if (isAuthenticated && token && !playerLoading && !locationWarning) {
      applyFetch({
        search: initialSearch || undefined,
        sortBy: "price_asc",
        limit: LIMIT,
        offset: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, playerLoading, locationWarning]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleLoadMore = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    applyFetch({ ...paramsRef.current, limit: LIMIT, offset: newOffset }, true);
  };

  const handleBuy = async (listingId: string, qty: number) => {
    if (!token) return { success: false, message: "Not authenticated." };
    return await purchaseItemAction(token, listingId, qty);
  };

  // ── derived state ──────────────────────────────────────────────────────────

  const hasMore = offset + LIMIT < total;

  // ── unauthenticated gate ────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <StorefrontIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Marketplace
        </Typography>
        <Typography color="text.secondary">
          Please log in to browse the marketplace.
        </Typography>
      </Box>
    );
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {locationWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {locationWarning}
        </Alert>
      )}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <FilterPane
          fetchListings={applyFetch}
          loading={loading}
          initialSearch={initialSearch}
        />
        <ItemSection
          listings={listings}
          total={total}
          hasFetched={hasFetched}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onBuy={handleBuy}
          druppleBalance={druppleBalance}
          currentUsername={username}
        />
      </Box>
    </>
  );
}

// ---------------------------------------------------------------------------
// Public export — wraps inner component in Suspense (required for useSearchParams)
// ---------------------------------------------------------------------------

export function MarketBrowser() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <MarketBrowserContent />
    </Suspense>
  );
}
