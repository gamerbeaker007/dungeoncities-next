"use client";

import { MonsterDropsDialog } from "@/components/undiscovered/monster-drops-dialog";
import { useCommunityMonsterDex } from "@/hooks/use-community-monster-dex";
import { usePlayerMonsterDex } from "@/hooks/use-player-monster-dex";
import { formatMonsterLocationFromRecord } from "@/lib/format-utils";
import type { MonsterDiscoveryListItem } from "@/lib/monster-discovery-data";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SearchIcon from "@mui/icons-material/Search";
import SyncIcon from "@mui/icons-material/Sync";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = "community" | "personal";

// ---------------------------------------------------------------------------
// Monster card
// ---------------------------------------------------------------------------

function MonsterCard({
  monster,
  viewMode,
  onClick,
}: {
  monster: MonsterDiscoveryListItem;
  viewMode: ViewMode;
  onClick: () => void;
}) {
  return (
    <Box
      sx={{
        flex: "1 1 200px",
        minWidth: { xs: "100%", sm: 200 },
        maxWidth: { xs: "100%", sm: 280 },
      }}
    >
      <Card
        variant="outlined"
        sx={{ height: "100%", cursor: "pointer" }}
        onClick={onClick}
      >
        <CardContent>
          <Stack spacing={1.5} alignItems="center">
            {monster.monsterImageUrl ? (
              <Box
                component="img"
                src={monster.monsterImageUrl}
                alt={monster.monsterName}
                sx={{
                  width: "100%",
                  maxWidth: 180,
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 1,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 180,
                  height: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "grey.200",
                  borderRadius: 1,
                }}
              >
                <HelpOutlineIcon sx={{ fontSize: 48, color: "grey.500" }} />
              </Box>
            )}

            <Typography variant="h6" align="center">
              {monster.monsterName}
            </Typography>

            <Stack
              direction="row"
              spacing={0.5}
              flexWrap="wrap"
              justifyContent="center"
            >
              <Chip
                label={
                  monster.fullyDiscovered
                    ? "Fully discovered"
                    : `${monster.unidentifiedDropCount} unidentified ${
                        monster.unidentifiedDropCount === 1 ? "item" : "items"
                      }`
                }
                size="small"
                color={monster.fullyDiscovered ? "success" : "warning"}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary" align="center">
              {formatMonsterLocationFromRecord(
                monster,
                viewMode === "personal",
              )}
            </Typography>

            {viewMode === "personal" && monster.encountered && (
              <Typography variant="body2" color="text.secondary" align="center">
                Kills: {monster.totalKills}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Monster grid
// ---------------------------------------------------------------------------

function MonsterGrid({
  monsters,
  emptyMessage,
  viewMode,
  onSelect,
}: {
  monsters: MonsterDiscoveryListItem[];
  emptyMessage: string;
  viewMode: ViewMode;
  onSelect: (m: MonsterDiscoveryListItem) => void;
}) {
  if (monsters.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Box
      sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "stretch" }}
    >
      {monsters.map((monster) => (
        <MonsterCard
          key={monster.monsterId}
          monster={monster}
          viewMode={viewMode}
          onClick={() => onSelect(monster)}
        />
      ))}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Sync button — thin presentational wrapper over usePlayerMonsterDex values
// ---------------------------------------------------------------------------

function SyncButton({
  syncing,
  canSync,
  minutesUntilSync,
  progress,
  statusText,
  error,
  successText,
  communityWarning,
  onSync,
}: {
  syncing: boolean;
  canSync: boolean;
  minutesUntilSync: number;
  progress: number;
  statusText: string;
  error: string | null;
  successText: string | null;
  communityWarning: string | null;
  onSync: () => void;
}) {
  const rateLimited = minutesUntilSync > 0;

  const tooltipTitle =
    !canSync && !syncing
      ? rateLimited
        ? `Next sync available in ${minutesUntilSync} minute${
            minutesUntilSync !== 1 ? "s" : ""
          }`
        : "Log in to sync your data"
      : "Fetch your monster data and contribute to the community database";

  return (
    <Stack spacing={1} sx={{ minWidth: 220 }}>
      <Tooltip title={tooltipTitle}>
        <span>
          <Button
            variant="outlined"
            size="small"
            startIcon={syncing ? <CircularProgress size={14} /> : <SyncIcon />}
            disabled={!canSync || syncing}
            onClick={onSync}
            fullWidth
          >
            {syncing ? statusText || "Syncing..." : "Sync my data"}
          </Button>
        </span>
      </Tooltip>

      {syncing && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ borderRadius: 1 }}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ py: 0 }}>
          {error}
        </Alert>
      )}
      {successText && (
        <Alert severity="success" sx={{ py: 0 }}>
          {successText}
        </Alert>
      )}
      {communityWarning && (
        <Alert severity="warning" sx={{ py: 0 }}>
          {communityWarning}
        </Alert>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function UndiscoveredMonstersList() {
  const [selectedMonster, setSelectedMonster] =
    useState<MonsterDiscoveryListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("community");

  // Community data from Supabase (via server action)
  const community = useCommunityMonsterDex();

  // Personal data from localStorage + sync flow
  const player = usePlayerMonsterDex();

  // Fallback: when community data failed to load, use personal data on the community tab
  const communityUnavailable = !community.loading && !community.hasData;
  const communityMonstersResolved = communityUnavailable
    ? player.monsters
    : community.monsters;

  const activeMonsters =
    viewMode === "community" ? communityMonstersResolved : player.monsters;

  const filteredMonsters = useMemo(() => {
    if (!searchQuery.trim()) return activeMonsters;
    const normalized = searchQuery.toLowerCase();
    return activeMonsters.filter((m) =>
      m.monsterName.toLowerCase().includes(normalized),
    );
  }, [activeMonsters, searchQuery]);

  const notDiscovered = useMemo(
    () => filteredMonsters.filter((m) => !m.discovered),
    [filteredMonsters],
  );
  const notFullyDiscovered = useMemo(
    () => filteredMonsters.filter((m) => m.discovered && !m.fullyDiscovered),
    [filteredMonsters],
  );
  const fullyDiscovered = useMemo(
    () => filteredMonsters.filter((m) => m.fullyDiscovered),
    [filteredMonsters],
  );

  // Aggregate stats — always from the active monster list
  const stats = useMemo(() => {
    const isPersonalView = viewMode === "personal";
    const isPersonalFallback = viewMode === "community" && communityUnavailable;
    const total =
      isPersonalView || isPersonalFallback
        ? player.totalMonsters || player.monsters.length
        : community.totalMonsters || community.monsters.length;
    const discoveries =
      isPersonalView || isPersonalFallback
        ? player.totalDiscoveries
        : community.totalDiscoveries;
    const discovered = activeMonsters.filter((m) => m.discovered).length;
    const fully = activeMonsters.filter((m) => m.fullyDiscovered).length;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return {
      total,
      discoveries,
      discovered,
      discoveredPct: pct(discovered),
      fully,
      fullyPct: pct(fully),
    };
  }, [viewMode, communityUnavailable, community, player, activeMonsters]);

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Monster Discovery Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monsters grouped by discovery progress.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          <Link suppressHydrationWarning href="/">
            Back to Resource Finder
          </Link>
        </Typography>
      </Box>

      {/* View toggle + sync */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Tabs
          value={viewMode}
          onChange={(_, v: ViewMode) => setViewMode(v)}
          aria-label="View mode"
        >
          <Tab value="community" label="Community" />
          <Tab value="personal" label="My Progression" />
        </Tabs>

        <SyncButton
          syncing={player.syncing}
          canSync={player.canSync}
          minutesUntilSync={player.minutesUntilSync}
          progress={player.progress}
          statusText={player.statusText}
          error={player.error}
          successText={player.successText}
          communityWarning={player.communityWarning}
          onSync={player.sync}
        />
      </Stack>

      {/* Personal data hint */}
      {viewMode === "personal" &&
        player.monsters.length === 0 &&
        !player.syncing && (
          <Alert severity="info">
            No personal data found. Sync your data to see your own progression.
          </Alert>
        )}

      {/* Community data fallback banners */}
      {viewMode === "community" &&
        communityUnavailable &&
        player.monsters.length > 0 && (
          <Alert severity="warning">
            Community data is unavailable — showing your personal sync data
            instead.
          </Alert>
        )}
      {viewMode === "community" &&
        communityUnavailable &&
        player.monsters.length === 0 && (
          <Alert severity="warning">
            Community data is unavailable and no personal data found. Use the{" "}
            <strong>Sync my data</strong> button above to fetch and store your
            monster data.
          </Alert>
        )}

      {/* Stats summary */}
      <Stack spacing={0.5}>
        <Typography variant="body2" color="text.secondary">
          Total monsters tracked: {activeMonsters.length}
          {community.loading && " (loading...)"}
          {searchQuery && `  ·  Showing: ${filteredMonsters.length}`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Basics discovered: {stats.discovered} / {stats.total} (
          {stats.discoveredPct}%)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fully discovered: {stats.fully} / {stats.total} ({stats.fullyPct}%)
        </Typography>
      </Stack>

      {/* Search */}
      <TextField
        fullWidth
        label="Search monsters"
        placeholder="Search by monster name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {/* Accordion groups */}
      <Stack spacing={1}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Not Discovered ({notDiscovered.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <MonsterGrid
              monsters={notDiscovered}
              emptyMessage="No monsters in this group."
              viewMode={viewMode}
              onSelect={setSelectedMonster}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Partially Discovered ({notFullyDiscovered.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <MonsterGrid
              monsters={notFullyDiscovered}
              emptyMessage="No monsters in this group."
              viewMode={viewMode}
              onSelect={setSelectedMonster}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Fully Discovered ({fullyDiscovered.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <MonsterGrid
              monsters={fullyDiscovered}
              emptyMessage="No fully discovered monsters yet."
              viewMode={viewMode}
              onSelect={setSelectedMonster}
            />
          </AccordionDetails>
        </Accordion>
      </Stack>

      <MonsterDropsDialog
        monster={selectedMonster}
        onClose={() => setSelectedMonster(null)}
      />
    </Stack>
  );
}
