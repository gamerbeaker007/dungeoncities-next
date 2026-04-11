"use client";

import { purchaseItemAction } from "@/actions/game-actions";
import { useMarket } from "@/hooks/use-market";
import { useAuth } from "@/providers/auth-provider";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { FilterPane } from "./filter-pane";
import { ItemSection } from "./item-section";

// ---------------------------------------------------------------------------
// Inner component (uses useSearchParams — must be inside Suspense)
// ---------------------------------------------------------------------------

function MarketBrowserContent() {
  const { token, isAuthenticated, username } = useAuth();
  const {
    locationWarning,
    playerLoading,
    drubbleBalance,
    listings,
    total,
    hasMore,
    listingsLoading: loading,
    listingsError: error,
    searchListings,
    loadMore,
    refreshAfterPurchase,
  } = useMarket();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";

  // Auto-load once location is confirmed at IN_MARKETPLACE
  useEffect(() => {
    if (isAuthenticated && token && !playerLoading && !locationWarning) {
      void searchListings({
        search: initialSearch || undefined,
        sortBy: "price_asc",
        limit: 0, // overridden by hook
        offset: 0, // overridden by hook
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, playerLoading, locationWarning]);

  const handleBuy = async (listingId: string, qty: number) => {
    if (!token) return { success: false, message: "Not authenticated." };
    const result = await purchaseItemAction(token, listingId, qty);
    if (result?.success) {
      void refreshAfterPurchase();
    }
    return result;
  };

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
          onSearch={searchListings}
          loading={loading}
          initialSearch={initialSearch}
        />
        <ItemSection
          listings={listings}
          total={total}
          loading={loading}
          error={error}
          onBuy={handleBuy}
          drubbleBalance={drubbleBalance}
          currentUsername={username}
          hasMore={hasMore}
          onLoadMore={loadMore}
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
