"use client";

import type { DCMarketplaceSortBy } from "@/types/dc/marketplace";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
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

type FilterPaneProps = {
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  loading: boolean;
  sortBy: DCMarketplaceSortBy;
  onSortChange: (sort: DCMarketplaceSortBy) => void;
  classFilter: string;
  onClassChange: (cls: string) => void;
  subCategoryFilter: string;
  onSubCategoryChange: (e: React.MouseEvent, val: string | null) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
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
  searchInput,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  loading,
  sortBy,
  onSortChange,
  classFilter,
  onClassChange,
  subCategoryFilter,
  onSubCategoryChange,
  onKeyDown,
}: FilterPaneProps) {
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
      {/* Search */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <SectionLabel>Search</SectionLabel>
        <TextField
          size="small"
          placeholder="Item name…"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={onKeyDown}
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
                  <IconButton size="small" onClick={onClearSearch}>
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
          onClick={onSearch}
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
            onClick={() => onSortChange(opt.value)}
            disabled={loading}
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
            onChange={(e) => onClassChange(e.target.value)}
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
          onChange={onSubCategoryChange}
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
    </Paper>
  );
}
