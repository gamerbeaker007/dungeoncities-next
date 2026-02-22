"use client";

import {
  formatDropQty,
  formatMonsterLocationFromRecord,
} from "@/lib/format-utils";
import type { MonsterDiscoveryListItem } from "@/lib/monster-discovery-data";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

type MonsterDropsDialogProps = {
  monster: MonsterDiscoveryListItem | null;
  onClose: () => void;
};

function formatDropChance(dropChance: number) {
  return dropChance === 0 ? "??" : `${dropChance}%`;
}

function isUndiscoveredDrop(drop: MonsterDiscoveryListItem["drops"][number]) {
  const name = (drop.itemName ?? "???").trim();
  return (
    !drop.unlocked ||
    Boolean(drop.itemNameWarning) ||
    name === "???" ||
    drop.dropChance === 0
  );
}

function getDropDisplayName(drop: MonsterDiscoveryListItem["drops"][number]) {
  const itemName = (drop.itemName ?? "???").trim();
  const derivedName = (drop.derivedItemName ?? "").trim();
  const hasUnknownName = itemName === "???" || Boolean(drop.itemNameWarning);
  if (hasUnknownName && derivedName) {
    return derivedName;
  }
  return itemName || "???";
}

function DropRow({
  drop,
}: {
  drop: MonsterDiscoveryListItem["drops"][number];
}) {
  const displayName = getDropDisplayName(drop);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        py: 0.5,
      }}
    >
      <Tooltip
        placement="top"
        title={
          <Stack spacing={1} sx={{ p: 0.5, minWidth: 220 }}>
            {drop.itemImageUrl ? (
              <Box
                component="img"
                src={drop.itemImageUrl}
                alt={displayName}
                sx={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 1,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: 180,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "grey.200",
                  borderRadius: 1,
                }}
              >
                <HelpOutlineIcon sx={{ fontSize: 44, color: "grey.500" }} />
              </Box>
            )}
            <Typography variant="body2">{displayName}</Typography>
            <Typography variant="caption">
              Chance: {formatDropChance(drop.dropChance)}
            </Typography>
            <Typography variant="caption">
              Qty: {formatDropQty(drop.minQuantity, drop.maxQuantity)}
            </Typography>
          </Stack>
        }
      >
        {drop.itemImageUrl ? (
          <Box
            component="img"
            src={drop.itemImageUrl}
            alt={displayName}
            sx={{
              width: 45,
              height: 45,
              objectFit: "cover",
              borderRadius: 0.75,
              cursor: "zoom-in",
            }}
          />
        ) : (
          <Box
            sx={{
              width: 45,
              height: 45,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "grey.200",
              borderRadius: 0.75,
              cursor: "zoom-in",
            }}
          >
            <HelpOutlineIcon sx={{ fontSize: 18, color: "grey.500" }} />
          </Box>
        )}
      </Tooltip>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" noWrap>
          {displayName} {drop.unlocked ? "" : "(Locked)"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          •
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Drop Chance: {formatDropChance(drop.dropChance)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          •
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Drop Qty: {formatDropQty(drop.minQuantity, drop.maxQuantity)}
        </Typography>
      </Stack>
    </Box>
  );
}

function DropGroup({
  title,
  drops,
}: {
  title: string;
  drops: MonsterDiscoveryListItem["drops"];
}) {
  if (drops.length === 0) {
    return null;
  }

  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" color="text.secondary">
        {title}
      </Typography>
      {drops.map((drop, index) => (
        <DropRow key={`${drop.itemId}-${index}-${title}`} drop={drop} />
      ))}
    </Stack>
  );
}

export function MonsterDropsDialog({
  monster,
  onClose,
}: MonsterDropsDialogProps) {
  const drops = monster?.drops ?? [];
  const basicDrops = drops.filter(
    (drop) => !isUndiscoveredDrop(drop) && !drop.bossDrop,
  );
  const bossDrops = drops.filter(
    (drop) => !isUndiscoveredDrop(drop) && drop.bossDrop,
  );
  const undiscoveredBasicDrops = drops.filter(
    (drop) => isUndiscoveredDrop(drop) && drop.bossDrop === false,
  );
  const undiscoveredBossDrops = drops.filter(
    (drop) => isUndiscoveredDrop(drop) && drop.bossDrop === true,
  );
  const undiscoveredRestDrops = drops.filter(
    (drop) =>
      isUndiscoveredDrop(drop) &&
      drop.bossDrop !== true &&
      drop.bossDrop !== false,
  );

  return (
    <Dialog open={Boolean(monster)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{monster?.monsterName ?? "Monster drops"}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          {monster ? (
            <Stack spacing={1}>
              {monster.monsterImageUrl ? (
                <Box
                  component="img"
                  src={monster.monsterImageUrl}
                  alt={monster.monsterName}
                  sx={{
                    display: "block",
                    mx: "auto",
                    width: "50%",
                    maxHeight: 220,
                    objectFit: "cover",
                    borderRadius: 1,
                  }}
                />
              ) : null}
              <Typography variant="h6">{monster.monsterName}</Typography>
              <Typography variant="body2" color="text.secondary">
                Class: {monster.monsterClass || "Unknown"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Location: {formatMonsterLocationFromRecord(monster)}
              </Typography>
              <Divider />
            </Stack>
          ) : null}

          {drops.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No drops available for this monster.
            </Typography>
          ) : (
            <>
              <DropGroup title="Basic items" drops={basicDrops} />
              <DropGroup title="Boss items" drops={bossDrops} />
              {(basicDrops.length > 0 || bossDrops.length > 0) &&
              (undiscoveredBasicDrops.length > 0 ||
                undiscoveredBossDrops.length > 0 ||
                undiscoveredRestDrops.length > 0) ? (
                <Divider />
              ) : null}
              {undiscoveredBasicDrops.length > 0 ||
              undiscoveredBossDrops.length > 0 ||
              undiscoveredRestDrops.length > 0 ? (
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Undiscovered items
                  </Typography>
                  <DropGroup
                    title="Basic items"
                    drops={undiscoveredBasicDrops}
                  />
                  <DropGroup title="Boss items" drops={undiscoveredBossDrops} />
                  <DropGroup title="Rest" drops={undiscoveredRestDrops} />
                </Stack>
              ) : null}
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
