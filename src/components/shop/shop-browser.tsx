"use client";

import {
  useShop,
  type LockedItemData,
  type SellResult,
} from "@/hooks/use-shop";
import { useAuth } from "@/providers/auth-provider";
import type { DCGameInventoryItem } from "@/types/dc/state";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import SellIcon from "@mui/icons-material/Sell";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import StoreIcon from "@mui/icons-material/Store";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
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
import { useState } from "react";
import { formatPrice } from "../market/item-section";
import { SellConfirmDialog } from "./sell-confirm-dialog";

function ItemImage({
  imageUrl,
  name,
}: Readonly<{ imageUrl: string; name: string }>) {
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

function SellResultsSummary({
  results,
  onClose,
}: Readonly<{
  results: SellResult[];
  onClose: () => void;
}>) {
  if (results.length === 0) return null;

  const successCount = results.filter((r) => r.success).length;
  const totalEarned = results
    .filter((r) => r.success && r.totalValue)
    .reduce((sum, r) => sum + (r.totalValue ?? 0), 0);

  return (
    <Snackbar
      open={results.length > 0}
      autoHideDuration={8000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity={successCount === results.length ? "success" : "warning"}
        variant="filled"
        sx={{ width: "100%" }}
      >
        Sold {successCount}/{results.length} items for{" "}
        {formatPrice(totalEarned)} DR
        {successCount < results.length && (
          <> ({results.length - successCount} failed)</>
        )}
      </Alert>
    </Snackbar>
  );
}

function ManageLockedItemsDialog({
  open,
  lockedItems,
  onUnlock,
  onClearAll,
  onClose,
}: Readonly<{
  open: boolean;
  lockedItems: LockedItemData[];
  onUnlock: (itemId: number) => void;
  onClearAll: () => void;
  onClose: () => void;
}>) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Locked Items</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {lockedItems.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
            No items are locked.
          </Typography>
        ) : (
          <List dense disablePadding>
            {lockedItems.map((item) => (
              <ListItem
                key={item.itemId}
                secondaryAction={
                  <Tooltip title="Unlock this item">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => onUnlock(item.itemId)}
                    >
                      <LockOpenIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <ItemImage imageUrl={item.imageUrl} name={item.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={item.name}
                  secondary={item.category || undefined}
                  primaryTypographyProps={{ variant: "body2" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        {lockedItems.length > 0 && (
          <Button
            size="small"
            color="warning"
            startIcon={<LockOpenOutlinedIcon />}
            onClick={onClearAll}
          >
            Unlock All
          </Button>
        )}
        <Button size="small" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function InventoryTable({
  inventory,
  lockedItemIds,
  selectedItemIds,
  selling,
  onToggleLock,
  onToggleSelect,
}: Readonly<{
  inventory: DCGameInventoryItem[];
  lockedItemIds: Set<number>;
  selectedItemIds: Set<string>;
  selling: boolean;
  onToggleLock: (itemId: number, itemData: LockedItemData) => void;
  onToggleSelect: (id: string) => void;
}>) {
  if (inventory.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
        Your inventory is empty.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell width={40} padding="checkbox" />
            <TableCell width={40} />
            <TableCell>Item</TableCell>
            <TableCell align="right" width={60}>
              Qty
            </TableCell>
            <TableCell align="right" width={100}>
              Sell Price
            </TableCell>
            <TableCell width={50} align="center">
              Lock
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {inventory.map((invItem) => {
            const isLocked = lockedItemIds.has(invItem.itemId);
            const isSelected = selectedItemIds.has(invItem.id);

            return (
              <TableRow
                key={invItem.id}
                hover={!isLocked}
                onClick={() => {
                  if (!isLocked && !selling) {
                    onToggleSelect(invItem.id);
                  }
                }}
                sx={{
                  cursor: !isLocked && !selling ? "pointer" : "default",
                  ...(isSelected && {
                    bgcolor: "action.selected",
                  }),
                  ...(isLocked && {
                    opacity: 0.6,
                  }),
                }}
              >
                <TableCell padding="checkbox" sx={{ pl: 1 }}>
                  {!isLocked && (
                    <IconButton
                      size="small"
                      disabled={selling}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(invItem.id);
                      }}
                    >
                      {isSelected ? (
                        <CheckBoxIcon color="primary" fontSize="small" />
                      ) : (
                        <CheckBoxOutlineBlankIcon fontSize="small" />
                      )}
                    </IconButton>
                  )}
                </TableCell>
                <TableCell sx={{ p: 0.5, pl: 1 }}>
                  <ItemImage
                    imageUrl={invItem.item.imageUrl}
                    name={invItem.item.name}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500} lineHeight={1.2}>
                    {invItem.item.name}
                  </Typography>
                  <Stack direction={"column"}>
                    <Typography variant="caption" color="text.secondary">
                      {invItem.item.category}
                      {invItem.item.class
                        ? ` · ${invItem.item.class}-class`
                        : ""}
                      {invItem.item.subCategory
                        ? ` · ${invItem.item.subCategory}`
                        : ""}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {invItem.item.description}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{invItem.quantity}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={500}>
                    {formatPrice(
                      Number.parseFloat(invItem.item.sellPrice) *
                        invItem.quantity,
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {invItem.item.sellCurrency}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={isLocked ? "Unlock item" : "Lock item"}>
                    <IconButton
                      size="small"
                      disabled={selling}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLock(invItem.itemId, {
                          itemId: invItem.itemId,
                          name: invItem.item.name,
                          imageUrl: invItem.item.imageUrl,
                          category: invItem.item.category,
                        });
                      }}
                      color={isLocked ? "warning" : "default"}
                    >
                      {isLocked ? (
                        <LockIcon fontSize="small" />
                      ) : (
                        <LockOpenIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ShopBrowserContent() {
  const { isAuthenticated } = useAuth();
  const {
    inventory,
    drubbleBalance,
    locationWarning,
    loading,
    error,
    selling,
    sellResults,
    lockedItemIds,
    lockedItems,
    selectedItemIds,
    toggleLock,
    toggleSelect,
    selectAll,
    deselectAll,
    sellSelected,
    sellAll,
    clearSellResults,
    clearAllLocks,
  } = useShop();

  const [sellDialogMode, setSellDialogMode] = useState<
    "selected" | "all" | null
  >(null);
  const [manageLocksOpen, setManageLocksOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <StoreIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Shop
        </Typography>
        <Typography color="text.secondary">
          Please log in to access the shop.
        </Typography>
      </Box>
    );
  }

  const sellableItems = inventory.filter(
    (item) => !lockedItemIds.has(item.itemId),
  );

  const selectedSellableItems = inventory.filter(
    (item) => selectedItemIds.has(item.id) && !lockedItemIds.has(item.itemId),
  );

  const dialogItems =
    sellDialogMode === "all" ? sellableItems : selectedSellableItems;

  return (
    <>
      {locationWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {locationWarning}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && inventory.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !locationWarning && inventory.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Sticky action bar */}
          <Paper
            variant="outlined"
            sx={{
              position: "sticky",
              top: 64,
              zIndex: 10,
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              bgcolor: "background.paper",
            }}
          >
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
                {inventory.length} item{inventory.length === 1 ? "" : "s"} in
                inventory
                {selectedItemIds.size > 0 && (
                  <>
                    {" "}
                    · <strong>{selectedItemIds.size}</strong> selected
                  </>
                )}
              </Typography>

              {drubbleBalance !== null && (
                <Tooltip title="Your Drubble (DR) balance">
                  <Chip
                    icon={<StoreIcon sx={{ fontSize: "14px !important" }} />}
                    label={`${formatPrice(drubbleBalance)} DR`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Tooltip>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<SelectAllIcon />}
                onClick={
                  selectedItemIds.size === sellableItems.length &&
                  sellableItems.length > 0
                    ? deselectAll
                    : selectAll
                }
                disabled={selling || sellableItems.length === 0}
              >
                {selectedItemIds.size === sellableItems.length &&
                sellableItems.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </Button>

              <Button
                size="small"
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={() => setManageLocksOpen(true)}
                color={lockedItems.length > 0 ? "warning" : "inherit"}
              >
                Locked ({lockedItems.length})
              </Button>

              <Button
                size="small"
                variant="contained"
                color="warning"
                startIcon={<SellIcon />}
                onClick={() => setSellDialogMode("selected")}
                disabled={selling || selectedSellableItems.length === 0}
              >
                Sell Selected ({selectedSellableItems.length})
              </Button>

              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<SellIcon />}
                onClick={() => setSellDialogMode("all")}
                disabled={selling || sellableItems.length === 0}
              >
                Sell All Unlocked ({sellableItems.length})
              </Button>
            </Box>

            <Collapse in={selling}>
              <Alert severity="info" icon={<CircularProgress size={20} />}>
                Selling items... Please wait.
              </Alert>
            </Collapse>
          </Paper>

          <InventoryTable
            inventory={inventory}
            lockedItemIds={lockedItemIds}
            selectedItemIds={selectedItemIds}
            selling={selling}
            onToggleLock={toggleLock}
            onToggleSelect={toggleSelect}
          />
        </Box>
      )}

      {!loading && !locationWarning && inventory.length === 0 && !error && (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            Your inventory is empty.
          </Typography>
        </Box>
      )}

      <SellConfirmDialog
        open={sellDialogMode !== null}
        items={dialogItems}
        selling={selling}
        onConfirmAction={async () => {
          if (sellDialogMode === "all") {
            await sellAll();
          } else {
            await sellSelected();
          }
          setSellDialogMode(null);
        }}
        onClose={() => setSellDialogMode(null)}
      />

      <ManageLockedItemsDialog
        open={manageLocksOpen}
        lockedItems={lockedItems}
        onUnlock={(itemId) => toggleLock(itemId)}
        onClearAll={() => {
          clearAllLocks();
          setManageLocksOpen(false);
        }}
        onClose={() => setManageLocksOpen(false)}
      />

      <SellResultsSummary results={sellResults} onClose={clearSellResults} />
    </>
  );
}

export function ShopBrowser() {
  return <ShopBrowserContent />;
}
