"use client";

import { PaginationLinks } from "@/components/resource-search/pagination-links";
import { ResourceCard } from "@/components/resource-search/resource-card";
import { SearchForm } from "@/components/resource-search/search-form";
import { useCommunityMonsterDex } from "@/hooks/use-community-monster-dex";
import { usePlayerMonsterDex } from "@/hooks/use-player-monster-dex";
import {
  buildResourceRows,
  getResourceSearchDataFromRows,
} from "@/lib/resource-search-data";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

function toPositiveInt(value: string | null | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

function buildSearchString(query: string, page: number) {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set("q", query.trim());
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return params.toString();
}

export function ResourceSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Community data loaded from Supabase via server action
  const community = useCommunityMonsterDex();
  const player = usePlayerMonsterDex();

  // Determine active data source with fallback:
  // 1. Community Supabase data (preferred)
  // 2. Personal localStorage data (fallback when community unavailable)
  // 3. Empty (show warning)
  const communityUnavailable = !community.loading && !community.hasData;
  const hasPersonalFallback =
    communityUnavailable && player.monsters.length > 0;
  const hasNoData = communityUnavailable && player.monsters.length === 0;

  const activeMonsters = communityUnavailable
    ? player.monsters
    : community.monsters;
  const totalMonsters = communityUnavailable
    ? player.totalMonsters
    : community.totalMonsters;

  // Build resource drop rows from active monster list
  const rows = useMemo(
    () => buildResourceRows(activeMonsters),
    [activeMonsters],
  );

  // Aggregate discovery stats from enriched monster list
  const discoveryStats = useMemo(() => {
    const total = totalMonsters || activeMonsters.length;
    const discovered = activeMonsters.filter((m) => m.discovered).length;
    const fully = activeMonsters.filter((m) => m.fullyDiscovered).length;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return {
      totalMonstersInGame: total,
      totalDiscoveredCount: discovered,
      totalDiscoveredPercentage: pct(discovered),
      fullyDiscoveredCount: fully,
      fullyPercentage: pct(fully),
    };
  }, [activeMonsters, totalMonsters]);

  const urlQuery = useMemo(() => searchParams.get("q") ?? "", [searchParams]);
  const urlPage = useMemo(
    () => toPositiveInt(searchParams.get("page"), 1),
    [searchParams],
  );

  const updateUrl = (nextQuery: string, nextPage: number) => {
    const queryString = buildSearchString(nextQuery, nextPage);
    const href = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(href, { scroll: false });
  };

  const onSubmitSearch = (value: string) => updateUrl(value, 1);
  const onPrevPage = () => updateUrl(urlQuery, Math.max(1, urlPage - 1));
  const onNextPage = () => updateUrl(urlQuery, urlPage + 1);

  const searchData = useMemo(
    () =>
      getResourceSearchDataFromRows(rows, {
        queryParam: urlQuery,
        pageParam: String(urlPage),
      }),
    [rows, urlPage, urlQuery],
  );

  const {
    totalResults,
    totalPages,
    currentPage,
    pagedResults,
    hasPrevPage,
    hasNextPage,
  } = searchData;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Resource Finder
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search resources with case-insensitive match and see which monster
          drops them and where that monster was first discovered.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {community.loading
            ? "Loading monster data..."
            : `Monsters basics discovered: ${discoveryStats.totalDiscoveredCount} out of ${discoveryStats.totalMonstersInGame} (${discoveryStats.totalDiscoveredPercentage}%)`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {!community.loading &&
            `Monsters fully discovered: ${discoveryStats.fullyDiscoveredCount} out of ${discoveryStats.totalMonstersInGame} (${discoveryStats.fullyPercentage}%)`}
        </Typography>
      </Box>

      <SearchForm query={urlQuery} onSubmit={onSubmitSearch} />

      {hasPersonalFallback && (
        <Alert severity="warning">
          Community data is unavailable — showing your personal sync data
          instead.
        </Alert>
      )}
      {hasNoData && (
        <Alert severity="warning">
          Community data is unavailable and no personal data found. Go to the{" "}
          <strong>Undiscovered</strong> page and sync your data first.
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary">
        Showing {pagedResults.length} of {totalResults} result(s)
      </Typography>

      {pagedResults.length === 0 ? (
        <Typography variant="body1">No results found.</Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "stretch",
          }}
        >
          {pagedResults.map((result) => (
            <Box
              key={result.key}
              sx={{
                flex: "1 1 280px",
                minWidth: { xs: "100%", sm: 280 },
              }}
            >
              <ResourceCard result={result} />
            </Box>
          ))}
        </Box>
      )}

      {totalPages > 1 && (
        <PaginationLinks
          currentPage={currentPage}
          totalPages={totalPages}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
        />
      )}
    </Stack>
  );
}
