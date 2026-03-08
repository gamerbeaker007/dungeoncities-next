"use client";

import type { DCMarketplaceListing } from "@/types/dc/marketplace";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BlockIcon from "@mui/icons-material/Block";
import GridViewIcon from "@mui/icons-material/GridView";
import InventoryIcon from "@mui/icons-material/Inventory";
import ListIcon from "@mui/icons-material/List";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BuyDialog, type BuyFn } from "./buy-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ViewMode = "list" | "grouped";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return String(price);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export function groupByItem(listings: DCMarketplaceListing[]) {
  const groups = new Map<
    number,
    { item: DCMarketplaceListing["item"]; rows: DCMarketplaceListing[] }
  >();
  for (const listing of listings) {
    const key = listing.item.itemId;
    if (!groups.has(key)) {
      groups.set(key, { item: listing.item, rows: [] });
    }
    groups.get(key)!.rows.push(listing);
  }
  return Array.from(groups.values());
}

export function getUniqueEquipmentSlots(
  listings: DCMarketplaceListing[],
): string[] {
  const slots = new Set<string>();
  for (const l of listings) {
    if (l.item.equipmentSlot) slots.add(l.item.equipmentSlot);
  }
  return Array.from(slots).sort();
}

export function getUniqueCategories(
  listings: DCMarketplaceListing[],
): string[] {
  const cats = new Set<string>();
  for (const l of listings) {
    if (l.item.category) cats.add(l.item.category);
  }
  return Array.from(cats).sort();
}

const CATEGORY_ICONS: Record<string, React.ReactElement> = {
  Resource: <InventoryIcon fontSize="small" />,
  QuestItems: <AutoAwesomeIcon fontSize="small" />,
};

function getCategoryIcon(category: string): React.ReactElement {
  return CATEGORY_ICONS[category] ?? <StorefrontIcon fontSize="small" />;
}

// ---------------------------------------------------------------------------
// ItemImage
// ---------------------------------------------------------------------------

function ItemImage({ imageUrl, name }: { imageUrl: string; name: string }) {
  if (!imageUrl) {
    return (
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: 0.5,
          bgcolor: "action.hover",
        }}
      />
    );
  }
  return (
    <Box
      sx={{
        position: "relative",
        width: 32,
        height: 32,
        flexShrink: 0,
        borderRadius: 0.5,
        overflow: "hidden",
        bgcolor: "action.hover",
      }}
    >
      <Image
        src={imageUrl}
        alt={name}
        fill
        sizes="32px"
        style={{ objectFit: "cover" }}
        unoptimized
      />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// ListingsTable (list view, enhanced rows)
// ---------------------------------------------------------------------------

function ListingsTable({
  listings,
  onSelect,
  currentUsername,
}: {
  listings: DCMarketplaceListing[];
  onSelect: (listing: DCMarketplaceListing) => void;
  currentUsername?: string | null;
}) {
  if (listings.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
        No listings found.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell width={40} />
            <TableCell>Item</TableCell>
            <TableCell align="right" width={70}>
              Qty
            </TableCell>
            <TableCell align="right" width={140}>
              Price / unit
            </TableCell>
            <TableCell width={130}>Seller</TableCell>
            <TableCell width={42} />
          </TableRow>
        </TableHead>
        <TableBody>
          {listings.map((l) => {
            const isOwn =
              !!currentUsername && l.seller.name === currentUsername;
            return (
              <TableRow
                key={l.id}
                hover={!isOwn}
                onClick={() => !isOwn && onSelect(l)}
                sx={{
                  cursor: isOwn ? "default" : "pointer",
                  ...(isOwn && {
                    borderLeft: 3,
                    borderColor: "primary.main",
                    opacity: 0.75,
                  }),
                }}
              >
                <TableCell sx={{ p: 0.5, pl: 1 }}>
                  <ItemImage imageUrl={l.item.imageUrl} name={l.item.name} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500} lineHeight={1.2}>
                    {l.item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {l.item.category}
                    {l.item.class ? ` · ${l.item.class}-class` : ""}
                  </Typography>
                  {l.item.description && (
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      display="block"
                      noWrap
                      sx={{ maxWidth: 340 }}
                    >
                      {l.item.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{l.quantity}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={500}>
                    {formatPrice(l.pricePerUnit)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {l.currency}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip
                    title={`Lv ${l.seller.level} · ${l.seller.currentState}`}
                  >
                    <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                      {l.seller.name}
                      {isOwn && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="primary.main"
                          sx={{ ml: 0.5 }}
                        >
                          (you)
                        </Typography>
                      )}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ p: 0.5 }}>
                  {isOwn ? (
                    <Tooltip title="This is your listing">
                      <BlockIcon
                        sx={{ fontSize: 18, color: "action.disabled" }}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Click row to buy">
                      <ShoppingCartIcon
                        sx={{ fontSize: 18, color: "action.active" }}
                      />
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ---------------------------------------------------------------------------
// GroupedSection (grouped view)
// ---------------------------------------------------------------------------

function GroupedSection({
  item,
  rows,
  onSelect,
  currentUsername,
}: {
  item: DCMarketplaceListing["item"];
  rows: DCMarketplaceListing[];
  onSelect: (listing: DCMarketplaceListing) => void;
  currentUsername?: string | null;
}) {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      {/* Group header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          bgcolor: "action.hover",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: 40,
            height: 40,
            borderRadius: 1,
            overflow: "hidden",
            flexShrink: 0,
            bgcolor: "background.paper",
          }}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="40px"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          ) : null}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {item.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.category}
            {item.class ? ` · ${item.class}-class` : ""}
            {" · "}
            {rows.length} listing{rows.length !== 1 ? "s" : ""}
          </Typography>
          {item.description && (
            <Typography
              variant="caption"
              color="text.disabled"
              display="block"
              noWrap
            >
              {item.description}
            </Typography>
          )}
        </Box>
        <Chip
          icon={getCategoryIcon(item.category)}
          label={item.category}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Compact rows */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell align="right" width={70}>
              Qty
            </TableCell>
            <TableCell align="right" width={140}>
              Price / unit
            </TableCell>
            <TableCell>Seller</TableCell>
            <TableCell width={42} />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((l) => {
            const isOwn =
              !!currentUsername && l.seller.name === currentUsername;
            return (
              <TableRow
                key={l.id}
                hover={!isOwn}
                onClick={() => !isOwn && onSelect(l)}
                sx={{
                  cursor: isOwn ? "default" : "pointer",
                  ...(isOwn && {
                    borderLeft: 3,
                    borderColor: "primary.main",
                    opacity: 0.75,
                  }),
                }}
              >
                <TableCell align="right">
                  <Typography variant="body2">{l.quantity}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={500}>
                    {formatPrice(l.pricePerUnit)}{" "}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {l.currency}
                    </Typography>
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip
                    title={`Lv ${l.seller.level} · ${l.seller.currentState}`}
                  >
                    <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                      {l.seller.name}
                      {isOwn && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="primary.main"
                          sx={{ ml: 0.5 }}
                        >
                          (you)
                        </Typography>
                      )}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ p: 0.5 }}>
                  {isOwn ? (
                    <Tooltip title="This is your listing">
                      <BlockIcon
                        sx={{ fontSize: 18, color: "action.disabled" }}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Click row to buy">
                      <ShoppingCartIcon
                        sx={{ fontSize: 18, color: "action.active" }}
                      />
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}

type ItemSectionProps = {
  /** All listings returned by the last API call. null = not yet fetched. */
  listings: DCMarketplaceListing[] | null;
  /** Total count reported by the API (may be > listings.length when paging). */
  total: number;
  loading: boolean;
  error: string | null;
  onBuy: BuyFn;
  drubbleBalance: number | null;
  currentUsername?: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
};

export function ItemSection({
  listings,
  total,
  loading,
  error,
  onBuy,
  drubbleBalance,
  currentUsername,
  hasMore,
  onLoadMore,
}: ItemSectionProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [equipmentSlotFilter, setEquipmentSlotFilter] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedListing, setSelectedListing] =
    useState<DCMarketplaceListing | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  const safeListings = listings ?? [];

  // Derived — compute unique values first so we can validate the active filters
  const uniqueCategories = getUniqueCategories(safeListings);
  const uniqueEquipmentSlots = getUniqueEquipmentSlots(safeListings);

  // A filter is only valid if the current listings still contain that value;
  // this naturally resets the secondary filters when new search results arrive.
  const activeCategoryFilter =
    categoryFilter && uniqueCategories.includes(categoryFilter)
      ? categoryFilter
      : null;
  const activeEquipmentSlotFilter =
    equipmentSlotFilter && uniqueEquipmentSlots.includes(equipmentSlotFilter)
      ? equipmentSlotFilter
      : null;

  const displayedListings = safeListings
    .filter(
      (l) => !activeCategoryFilter || l.item.category === activeCategoryFilter,
    )
    .filter(
      (l) =>
        !activeEquipmentSlotFilter ||
        l.item.equipmentSlot === activeEquipmentSlotFilter,
    );
  const groups = groupByItem(displayedListings);

  return (
    <Box
      sx={{
        flexGrow: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Results header */}
      {listings !== null && !loading && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ flexGrow: 1 }}
            >
              Showing <strong>{displayedListings.length}</strong>
              {activeCategoryFilter ? ` of ${safeListings.length}` : ""} listing
              {displayedListings.length !== 1 ? "s" : ""}
              {total > safeListings.length
                ? ` (${safeListings.length} of ${total} loaded)`
                : ""}
            </Typography>

            {/* DR balance badge */}
            {drubbleBalance !== null && (
              <Tooltip title="Your Drubble (DR) balance">
                <Chip
                  icon={<StorefrontIcon sx={{ fontSize: "14px !important" }} />}
                  label={`${formatPrice(drubbleBalance)} DR`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Tooltip>
            )}

            {/* View toggle */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="List view">
                <Button
                  variant={viewMode === "list" ? "contained" : "outlined"}
                  onClick={() => setViewMode("list")}
                >
                  <ListIcon fontSize="small" />
                </Button>
              </Tooltip>
              <Tooltip title="Grouped view">
                <Button
                  variant={viewMode === "grouped" ? "contained" : "outlined"}
                  onClick={() => setViewMode("grouped")}
                >
                  <GridViewIcon fontSize="small" />
                </Button>
              </Tooltip>
            </ButtonGroup>
          </Box>

          {/* Category chips (client-side filter) */}
          {uniqueCategories.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              <Chip
                label="All"
                size="small"
                color={activeCategoryFilter === null ? "primary" : "default"}
                onClick={() => setCategoryFilter(null)}
              />
              {uniqueCategories.map((cat) => (
                <Chip
                  key={cat}
                  icon={getCategoryIcon(cat)}
                  label={cat}
                  size="small"
                  color={activeCategoryFilter === cat ? "primary" : "default"}
                  onClick={() =>
                    setCategoryFilter(activeCategoryFilter === cat ? null : cat)
                  }
                />
              ))}
            </Box>
          )}

          {/* Equipment slot chips (client-side secondary filter) */}
          {uniqueEquipmentSlots.length > 0 && (
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mr: 0.5 }}
              >
                Slot:
              </Typography>
              <Chip
                label="All"
                size="small"
                color={
                  activeEquipmentSlotFilter === null ? "secondary" : "default"
                }
                onClick={() => setEquipmentSlotFilter(null)}
              />
              {uniqueEquipmentSlots.map((slot) => (
                <Chip
                  key={slot}
                  label={slot}
                  size="small"
                  color={
                    activeEquipmentSlotFilter === slot ? "secondary" : "default"
                  }
                  onClick={() =>
                    setEquipmentSlotFilter(
                      activeEquipmentSlotFilter === slot ? null : slot,
                    )
                  }
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Error */}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Initial loading spinner */}
      {loading && safeListings.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* List view */}
      {listings !== null && viewMode === "list" && (
        <ListingsTable
          listings={displayedListings}
          onSelect={setSelectedListing}
          currentUsername={currentUsername}
        />
      )}

      {/* Grouped view */}
      {listings !== null && viewMode === "grouped" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {groups.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", p: 3 }}
            >
              No listings found.
            </Typography>
          ) : (
            groups.map(({ item, rows }) => (
              <GroupedSection
                key={item.itemId}
                item={item}
                rows={rows}
                onSelect={setSelectedListing}
                currentUsername={currentUsername}
              />
            ))
          )}
        </Box>
      )}

      {/* Load more sentinel — triggers auto-load on scroll */}
      {hasMore && !activeCategoryFilter && !activeEquipmentSlotFilter && (
        <Box
          ref={sentinelRef}
          sx={{ display: "flex", justifyContent: "center", py: 3 }}
        >
          {loading && <CircularProgress size={24} />}
        </Box>
      )}

      {/* Buy dialog — opened by clicking any non-own listing row */}
      <BuyDialog
        key={selectedListing?.id ?? "none"}
        listing={selectedListing}
        open={selectedListing !== null}
        onClose={() => setSelectedListing(null)}
        onBuy={onBuy}
        drubbleBalance={drubbleBalance}
      />
    </Box>
  );
}
