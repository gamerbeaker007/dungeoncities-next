import type { LockedItemData } from "@/hooks/use-lock-items";
import { useAuth } from "@/providers/auth-provider";
import type { ForgeOwnedPlayerData, ForgeRequirement } from "@/types/forge";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

type ForgeItemProps = {
  requirement: ForgeRequirement;
  ownedData?: ForgeOwnedPlayerData;
  isMatchedTerm?: boolean;
  lockedItemIds: Set<number>;
  onToggleLock: (itemId: number, itemData: LockedItemData) => void;
};

export function ForgeItem({
  requirement,
  ownedData,
  isMatchedTerm = false,
  lockedItemIds,
  onToggleLock,
}: ForgeItemProps) {
  const { isAuthenticated } = useAuth();
  const forgeSearchHref = `/?q=${requirement.itemId}`;
  const marketHref = `/market?search=${encodeURIComponent(requirement.name)}`;
  const ownedQuantity = ownedData?.total ?? 0;
  const isLocked =
    requirement.itemId !== null && lockedItemIds.has(requirement.itemId);

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Tooltip
        title={
          <Box
            component="img"
            src={requirement.imageUrl ?? ""}
            alt={requirement.name}
            sx={{ width: 120, height: 120, objectFit: "cover" }}
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

      <Box sx={{ flexGrow: 1 }}>
        {isAuthenticated ? (
          <Tooltip
            title={
              ownedData
                ? `Inventory: ${ownedData.inventory} / Listed: ${ownedData.listed} / Expired: ${ownedData.expired}`
                : ""
            }
            placement="top"
          >
            <Typography
              variant="body2"
              color={
                ownedQuantity >= requirement.quantity
                  ? "success.main"
                  : "text.primary"
              }
              sx={{ cursor: ownedData ? "help" : "default" }}
            >
              {ownedQuantity} / {requirement.quantity} {requirement.name}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2">
            {requirement.quantity} {requirement.name}
          </Typography>
        )}
      </Box>

      <Tooltip title="Search for this item in forge recipes" placement="top">
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

      <Tooltip title="Find this item on the Marketplace" placement="top">
        <IconButton
          suppressHydrationWarning
          component={Link}
          href={marketHref}
          size="small"
          sx={{ p: 0.5 }}
        >
          <StorefrontIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      {requirement.itemId !== null && (
        <Tooltip
          title={isLocked ? "Unlock from shop" : "Lock in shop"}
          placement="top"
        >
          <IconButton
            size="small"
            sx={{ p: 0.5 }}
            color={isLocked ? "warning" : "default"}
            onClick={() =>
              onToggleLock(requirement.itemId as number, {
                itemId: requirement.itemId as number,
                name: requirement.name,
                imageUrl: requirement.imageUrl ?? "",
                category: "",
              })
            }
          >
            {isLocked ? (
              <LockIcon sx={{ fontSize: 16 }} />
            ) : (
              <LockOpenIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Tooltip>
      )}

      {isMatchedTerm && (
        <Tooltip title="This item matches your search term">
          <StarIcon sx={{ fontSize: 16, color: "warning.main" }} />
        </Tooltip>
      )}
    </Stack>
  );
}
