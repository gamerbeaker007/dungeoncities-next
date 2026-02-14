"use client";

import { PaginationLinks } from "@/components/resource-search/pagination-links";
import { ResourceCard } from "@/components/resource-search/resource-card";
import { SearchForm } from "@/components/resource-search/search-form";
import { getResourceSearchDataFromRows } from "@/lib/monster-data";
import type { ResourceResult } from "@/types/resource";
import { Box, Stack, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type ResourceSearchProps = {
  initialRows: ResourceResult[];
  discoveryStats: {
    totalMonsters: number;
    totalDiscoveredCount: number;
    totalPercentage: number;
    fullyDiscoveredCount: number;
    fullyPercentage: number;
  };
};

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

export function ResourceSearch({
  initialRows,
  discoveryStats,
}: ResourceSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const onSubmitSearch = (value: string) => {
    updateUrl(value, 1);
  };

  const onPrevPage = () => {
    const nextPage = Math.max(1, urlPage - 1);
    updateUrl(urlQuery, nextPage);
  };

  const onNextPage = () => {
    const nextPage = urlPage + 1;
    updateUrl(urlQuery, nextPage);
  };

  const searchData = useMemo(
    () =>
      getResourceSearchDataFromRows(initialRows, {
        queryParam: urlQuery,
        pageParam: String(urlPage),
      }),
    [initialRows, urlPage, urlQuery],
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
          Monsters discovered: {discoveryStats.totalDiscoveredCount} out of{" "}
          {discoveryStats.totalMonsters} ({discoveryStats.totalPercentage}%)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monsters fully discovered: {discoveryStats.fullyDiscoveredCount} out
          of {discoveryStats.totalDiscoveredCount} (
          {discoveryStats.fullyPercentage}%)
        </Typography>
      </Box>

      <SearchForm query={urlQuery} onSubmit={onSubmitSearch} />

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
