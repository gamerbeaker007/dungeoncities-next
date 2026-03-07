"use client";

import type {
  DCGetMarketplaceListingsParams,
  DCMarketplaceSortBy,
} from "@/types/dc/marketplace";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  Fab,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export type SortOption = { label: string; value: DCMarketplaceSortBy };

export const SORT_OPTIONS: SortOption[] = [
  { label: "Newest", value: "date_desc" },
  { label: "Oldest", value: "date_asc" },
  { label: "Price ↑", value: "price_asc" },
  { label: "Price ↓", value: "price_desc" },
];

export const CLASS_OPTIONS = [
  "",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "R",
  "S",
  "SS",
  "SSS",
];

export const SUBCATEGORY_OPTIONS = [
  "ALL",
  "Plant",
  "Rock",
  "Monster Drop",
  "Food",
  "Head Gear",
  "Face Gear",
  "Neck Gear",
  "Should Gear",
  "Arm Gear",
  "Hand Gear",
  "Torso Gear",
  "Waist Gear",
  "Leg Gear",
  "Feet Gear",
  "Accessory",
  "Weapon",
  "Shield",
  "Backpack",
  "Special Items",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LIMIT = 50;

type FilterPaneProps = {
  /** Wrapped fetchListings from market-browser (tracks params + resets offset). */
  fetchListings: (
    params: DCGetMarketplaceListingsParams,
    append?: boolean,
  ) => void;
  loading: boolean;
  initialSearch?: string;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={600}
      textTransform="uppercase"
      letterSpacing={0.5}
    >
      {children}
    </Typography>
  );
}

export function FilterPane({
  fetchListings,
  loading,
  initialSearch = "",
}: FilterPaneProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Filter state ────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<DCMarketplaceSortBy>("price_asc");
  const [classFilter, setClassFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("ALL");

  // ── Helpers ─────────────────────────────────────────────────────────────
  const buildParams = (
    overrides: Partial<{
      search: string;
      sortBy: DCMarketplaceSortBy;
      classFilter: string;
      subCategoryFilter: string;
    }> = {},
  ): DCGetMarketplaceListingsParams => {
    const s = overrides.search ?? searchInput;
    const sort = overrides.sortBy ?? sortBy;
    const cls = overrides.classFilter ?? classFilter;
    const sub = overrides.subCategoryFilter ?? subCategoryFilter;
    return {
      search: s || undefined,
      sortBy: sort,
      class: cls || undefined,
      subcategory: sub !== "ALL" ? sub : undefined,
      limit: LIMIT,
      offset: 0,
    };
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = () => {
    fetchListings(buildParams());
    if (isMobile) setDrawerOpen(false);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    router.replace("/market");
    fetchListings(buildParams({ search: "" }));
  };

  const handleSortChange = (newSort: DCMarketplaceSortBy) => {
    setSortBy(newSort);
    fetchListings(buildParams({ sortBy: newSort }));
  };

  const handleClassChange = (newClass: string) => {
    setClassFilter(newClass);
    fetchListings(buildParams({ classFilter: newClass }));
  };

  const handleSubCategoryChange = (
    _e: React.MouseEvent,
    val: string | null,
  ) => {
    if (val === null) return;
    setSubCategoryFilter(val);
    fetchListings(buildParams({ subCategoryFilter: val }));
  };

  const filterContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: isMobile ? 2 : 0,
        width: isMobile ? 280 : "auto",
      }}
    >
      {/* Search */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <SectionLabel>Search</SectionLabel>
        <TextField
          size="small"
          placeholder="Item name…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            handleSearch();
          }}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={14} />
            ) : (
              <SearchIcon fontSize="small" />
            )
          }
          fullWidth
        >
          Search
        </Button>
      </Box>

      <Divider />

      {/* Sort */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <SectionLabel>Sort</SectionLabel>
        {SORT_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            size="small"
            variant={sortBy === opt.value ? "contained" : "outlined"}
            onClick={() => handleSortChange(opt.value)}
            fullWidth
          >
            {opt.label}
          </Button>
        ))}
      </Box>

      <Divider />

      {/* Class */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <SectionLabel>Class</SectionLabel>
        <FormControl size="small" fullWidth>
          <Select
            displayEmpty
            value={classFilter}
            onChange={(e) => handleClassChange(e.target.value)}
            disabled={loading}
          >
            {CLASS_OPTIONS.map((c) => (
              <MenuItem key={c} value={c}>
                {c === "" ? "All classes" : `${c}-class`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider />

      {/* SubCategory */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <SectionLabel>SubCategory</SectionLabel>
        <ToggleButtonGroup
          value={subCategoryFilter}
          exclusive
          onChange={handleSubCategoryChange}
          orientation="vertical"
          sx={{ width: "100%" }}
        >
          {SUBCATEGORY_OPTIONS.map((sub) => (
            <ToggleButton
              key={sub}
              value={sub}
              disabled={loading}
              sx={{
                justifyContent: "flex-start",
                fontSize: "0.75rem",
                py: 0.5,
                px: 1,
                textTransform: "none",
              }}
            >
              {sub}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Box>
  );

  // ── Mobile: FAB + Drawer ────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <Fab
          color="primary"
          size="medium"
          aria-label="Open filters"
          onClick={() => setDrawerOpen(true)}
          sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 1200 }}
        >
          <FilterListIcon />
        </Fab>
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { pt: 2 } }}
        >
          {filterContent}
        </Drawer>
      </>
    );
  }

  // ── Desktop: sidebar Paper ──────────────────────────────────────────────
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        width: 220,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {filterContent}
    </Paper>
  );
}
