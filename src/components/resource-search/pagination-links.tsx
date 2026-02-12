"use client";

import { Button, Stack, Typography } from "@mui/material";

type PaginationLinksProps = {
  currentPage: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function PaginationLinks({
  currentPage,
  totalPages,
  hasPrevPage,
  hasNextPage,
  onPrevPage,
  onNextPage,
}: PaginationLinksProps) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Button onClick={onPrevPage} disabled={!hasPrevPage} variant="text">
        Previous
      </Button>

      <Typography variant="body2" color="text.secondary">
        Page {currentPage} of {totalPages}
      </Typography>

      <Button onClick={onNextPage} disabled={!hasNextPage} variant="text">
        Next
      </Button>
    </Stack>
  );
}
