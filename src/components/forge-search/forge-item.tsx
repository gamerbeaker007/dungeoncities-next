import { useAuth } from "@/providers/auth-provider";
import type { ForgeRequirement } from "@/types/forge";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

type ForgeItemProps = {
  requirement: ForgeRequirement;
  isMatchedTerm?: boolean;
};

export function ForgeItem({
  requirement,
  isMatchedTerm = false,
}: ForgeItemProps) {
  const { isAuthenticated } = useAuth();
  const forgeSearchHref = `/?q=${requirement.itemId}`;
  const ownedQuantity = requirement.ownedQuantity ?? 0;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Tooltip
        title={
          <Box
            component="img"
            src={requirement.imageUrl ?? ""}
            alt={requirement.name}
            sx={{
              width: 120,
              height: 120,
              objectFit: "cover",
            }}
          />
        }
        placement="right"
      >
        <Box
          component="img"
          src={requirement.imageUrl ?? ""}
          alt={requirement.name}
          sx={{
            width: 28,
            height: 28,
            objectFit: "cover",
            borderRadius: 0.5,
            cursor: "pointer",
          }}
        />
      </Tooltip>

      {isAuthenticated ? (
        <Typography
          variant="body2"
          color={
            ownedQuantity > requirement.quantity
              ? "success.main"
              : "text.primary"
          }
        >
          {ownedQuantity} / {requirement.quantity} {requirement.name}
        </Typography>
      ) : (
        <Typography variant="body2">
          {requirement.quantity} {requirement.name}
        </Typography>
      )}

      <Tooltip title="Search for this item in forge recipes">
        <IconButton
          suppressHydrationWarning
          component={Link}
          href={forgeSearchHref}
          size="small"
          sx={{ p: 0.5 }}
        >
          <SearchIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      {isMatchedTerm && (
        <Tooltip title="This item matches your search term">
          <StarIcon sx={{ fontSize: 16, color: "warning.main" }} />
        </Tooltip>
      )}
    </Stack>
  );
}
