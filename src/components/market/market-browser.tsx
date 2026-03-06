"use client";

import {
  getMarketplaceListingsAction,
  purchaseItemAction,
} from "@/actions/game-actions";
import { usePlayerItems } from "@/hooks/use-player-items";
import { useAuth } from "@/providers/auth-provider";
import type {
  DCGetMarketplaceListingsParams,
  DCMarketplaceListing,
  DCMarketplaceSortBy,
} from "@/types/dc/marketplace";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { BuyDialog, type BuyFn } from "./buy-dialog";
import { FilterPane } from "./filter-pane";
import {
  getUniqueCategories,
  getUniqueEquipmentSlots,
  groupByItem,
  ItemSection,
  type ViewMode,
} from "./item-section";

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const LIMIT = 50;

// ---------------------------------------------------------------------------
// Inner component (uses useSearchParams — must be inside Suspense)
// ---------------------------------------------------------------------------

function MarketBrowserContent() {
  const { token, isAuthenticated, username } = useAuth();
  const router = useRouter();
  const {
    isLoading: locationLoading,
    locationWarning,
    druppleBalance,
  } = usePlayerItems();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";

  // Initialise search state from URL param so the field is pre-populated
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);

  const [sortBy, setSortBy] = useState<DCMarketplaceSortBy>("price_asc");
  const [classFilter, setClassFilter] = useState<string>("");
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [equipmentSlotFilter, setEquipmentSlotFilter] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedListing, setSelectedListing] =
    useState<DCMarketplaceListing | null>(null);

  const [listings, setListings] = useState<DCMarketplaceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchListings = useCallback(
    async (
      params: Omit<DCGetMarketplaceListingsParams, "limit" | "offset"> & {
        limit?: number;
        offset?: number;
      },
      append = false,
    ) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await getMarketplaceListingsAction(token, params);
        if (!result) {
          setError("Failed to load marketplace listings.");
          return;
        }
        setTotal(result.total);
        setListings((prev) =>
          append ? [...prev, ...result.listings] : result.listings,
        );
        setHasFetched(true);
        setCategoryFilter(null);
        setEquipmentSlotFilter(null);
      } catch {
        setError("An error occurred while loading listings.");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  // Auto-load once location is confirmed at IN_MARKETPLACE
  useEffect(() => {
    if (isAuthenticated && token && !locationLoading && !locationWarning) {
      fetchListings({
        search: initialSearch || undefined,
        sortBy: "price_asc",
        limit: LIMIT,
        offset: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, locationLoading, locationWarning]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleSearch = () => {
    setActiveSearch(searchInput);
    setOffset(0);
    fetchListings({
      search: searchInput || undefined,
      sortBy,
      class: classFilter || undefined,
      subcategory: subCategoryFilter !== "ALL" ? subCategoryFilter : undefined,
      limit: LIMIT,
      offset: 0,
    });
  };

  const handleSortChange = (newSort: DCMarketplaceSortBy) => {
    setSortBy(newSort);
    setOffset(0);
    fetchListings({
      search: activeSearch || undefined,
      sortBy: newSort,
      class: classFilter || undefined,
      subcategory: subCategoryFilter !== "ALL" ? subCategoryFilter : undefined,
      limit: LIMIT,
      offset: 0,
    });
  };

  const handleClassChange = (newClass: string) => {
    setClassFilter(newClass);
    setOffset(0);
    fetchListings({
      search: activeSearch || undefined,
      sortBy,
      class: newClass || undefined,
      subcategory: subCategoryFilter !== "ALL" ? subCategoryFilter : undefined,
      limit: LIMIT,
      offset: 0,
    });
  };

  const handleSubCategoryChange = (
    _e: React.MouseEvent,
    val: string | null,
  ) => {
    if (val === null) return;
    setSubCategoryFilter(val);
    setOffset(0);
    fetchListings({
      search: activeSearch || undefined,
      sortBy,
      class: classFilter || undefined,
      subcategory: val !== "ALL" ? val : undefined,
      limit: LIMIT,
      offset: 0,
    });
  };

  const handleLoadMore = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchListings(
      {
        search: activeSearch || undefined,
        sortBy,
        class: classFilter || undefined,
        subcategory:
          subCategoryFilter !== "ALL" ? subCategoryFilter : undefined,
        limit: LIMIT,
        offset: newOffset,
      },
      true,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setOffset(0);
    router.replace("/market");
    fetchListings({
      sortBy,
      class: classFilter || undefined,
      subcategory: subCategoryFilter !== "ALL" ? subCategoryFilter : undefined,
      limit: LIMIT,
      offset: 0,
    });
  };

  const handleCategoryFilterChange = (cat: string | null) => {
    setCategoryFilter(cat);
    setEquipmentSlotFilter(null);
  };

  const handleBuy: BuyFn = async (listingId, qty) => {
    if (!token) return { success: false, message: "Not authenticated." };
    return await purchaseItemAction(token, listingId, qty);
  };

  // ── derived state ──────────────────────────────────────────────────────────

  const displayedListings = listings
    .filter((l) => !categoryFilter || l.item.category === categoryFilter)
    .filter(
      (l) =>
        !equipmentSlotFilter || l.item.equipmentSlot === equipmentSlotFilter,
    );

  const uniqueCategories = getUniqueCategories(listings);
  const uniqueEquipmentSlots = getUniqueEquipmentSlots(listings);
  const groups = groupByItem(displayedListings);
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
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          loading={loading}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          classFilter={classFilter}
          onClassChange={handleClassChange}
          subCategoryFilter={subCategoryFilter}
          onSubCategoryChange={handleSubCategoryChange}
          onKeyDown={handleKeyDown}
        />
        <ItemSection
          listings={listings}
          displayedListings={displayedListings}
          uniqueCategories={uniqueCategories}
          groups={groups}
          total={total}
          hasFetched={hasFetched}
          loading={loading}
          error={error}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={handleCategoryFilterChange}
          activeSearch={activeSearch}
          subCategoryFilter={subCategoryFilter}
          classFilter={classFilter}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onSelect={setSelectedListing}
          druppleBalance={druppleBalance}
          currentUsername={username}
          uniqueEquipmentSlots={uniqueEquipmentSlots}
          equipmentSlotFilter={equipmentSlotFilter}
          onEquipmentSlotFilterChange={setEquipmentSlotFilter}
        />
      </Box>
      <BuyDialog
        key={selectedListing?.id ?? "none"}
        listing={selectedListing}
        open={selectedListing !== null}
        onClose={() => setSelectedListing(null)}
        onBuy={handleBuy}
        druppleBalance={druppleBalance}
      />
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
