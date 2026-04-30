"use client";

import {
  type ChestInventoryItem,
  type DropSummaryEntry,
  useChestOpener,
} from "@/hooks/use-chest-opener";
import { useAuth } from "@/providers/auth-provider";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import BlockIcon from "@mui/icons-material/Block";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import CloseIcon from "@mui/icons-material/Close";
import InventoryIcon from "@mui/icons-material/Inventory";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Image from "next/image";

function ClassChip({ cls }: Readonly<{ cls: string }>) {
  const colorMap: Record<
    string,
    "default" | "primary" | "secondary" | "success" | "warning" | "error"
  > = {
    S: "error",
    A: "warning",
    B: "secondary",
    C: "primary",
    D: "default",
    R: "success",
  };
  return (
    <Chip
      label={cls}
      size="small"
      color={colorMap[cls] ?? "default"}
      sx={{ fontWeight: 700, minWidth: 28 }}
    />
  );
}

function ItemImage({
  imageUrl,
  name,
  size = 40,
}: Readonly<{ imageUrl: string; name: string; size?: number }>) {
  if (!imageUrl) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
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
        width: size,
        height: size,
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
        sizes={`${size}px`}
        style={{ objectFit: "cover" }}
        unoptimized
      />
    </Box>
  );
}

function ChestRow({ chest }: Readonly<{ chest: ChestInventoryItem }>) {
  return (
    <TableRow>
      <TableCell>
        <Stack direction="row" alignItems="center" gap={1}>
          <ItemImage imageUrl={chest.imageUrl} name={chest.name} />
          <Typography variant="body2">{chest.name}</Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">
        <ClassChip cls={chest.class} />
      </TableCell>
      <TableCell align="center">
        <Chip label={`×${chest.quantity}`} size="small" variant="outlined" />
      </TableCell>
    </TableRow>
  );
}

function DropSummary({
  summary,
  chestsOpened,
  onClear,
  disabled,
}: Readonly<{
  summary: DropSummaryEntry[];
  chestsOpened: number;
  onClear: () => void;
  disabled: boolean;
}>) {
  if (summary.length === 0) return null;
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Summary — {chestsOpened} chest{chestsOpened === 1 ? "" : "s"} opened
        </Typography>
        <Button
          size="small"
          startIcon={<ClearAllIcon />}
          onClick={onClear}
          disabled={disabled}
        >
          Clear
        </Button>
      </Stack>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item received</TableCell>
              <TableCell align="center">Class</TableCell>
              <TableCell align="center">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.map((entry) => (
              <TableRow key={entry.name}>
                <TableCell>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <ItemImage
                      imageUrl={entry.imageUrl}
                      name={entry.name}
                      size={28}
                    />
                    <Typography variant="body2">{entry.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <ClassChip cls={entry.class} />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`×${entry.count}`}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export function ChestOpener() {
  const { isAuthenticated } = useAuth();
  const {
    loading,
    opening,
    error,
    locationWarning,
    chestsToOpen,
    excludedChests,
    availableSpace,
    totalSpace,
    usedSpace,
    dropSummary,
    chestsOpened,
    minSpaceBuffer,
    fetchData,
    openAll,
    clearSummary,
  } = useChestOpener();

  if (!isAuthenticated) {
    return (
      <Alert severity="info">
        Log in with Hive Keychain to open chests from your inventory.
      </Alert>
    );
  }

  const totalChestCount = chestsToOpen.reduce((sum, c) => sum + c.quantity, 0);
  const canOpen =
    !opening &&
    !loading &&
    totalChestCount > 0 &&
    (availableSpace ?? 0) > minSpaceBuffer;

  return (
    <Stack gap={3}>
      {/* Inventory Status */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <InventoryIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>
              Inventory Status
            </Typography>
          </Stack>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => void fetchData()}
            disabled={loading || opening}
          >
            Refresh
          </Button>
        </Stack>
        {loading ? (
          <LinearProgress />
        ) : availableSpace !== null ? (
          <Stack gap={1}>
            <Stack direction="row" gap={2} flexWrap="wrap">
              <Typography variant="body2">
                Used: <strong>{usedSpace}</strong>
              </Typography>
              <Typography variant="body2">
                Total: <strong>{totalSpace}</strong>
              </Typography>
              <Typography
                variant="body2"
                color={
                  (availableSpace ?? 0) <= minSpaceBuffer
                    ? "error.main"
                    : "success.main"
                }
              >
                Available: <strong>{availableSpace}</strong>
              </Typography>
            </Stack>
            {(availableSpace ?? 0) <= minSpaceBuffer && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                Less than {minSpaceBuffer} spaces available — opening stopped.
              </Alert>
            )}
          </Stack>
        ) : null}
      </Paper>

      {locationWarning && <Alert severity="warning">{locationWarning}</Alert>}

      {error && (
        <Alert severity="error" onClose={() => void fetchData()}>
          {error}
        </Alert>
      )}

      {/* Chests to Open */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1.5}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <AllInboxIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>
              Chests to Open
            </Typography>
            {totalChestCount > 0 && (
              <Chip
                label={`${totalChestCount} total`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Stack>
          <Button
            variant="contained"
            color="primary"
            onClick={() => void openAll()}
            disabled={!canOpen}
            startIcon={
              opening ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <AllInboxIcon />
              )
            }
          >
            {opening ? "Opening…" : "Open All"}
          </Button>
        </Stack>

        {loading ? (
          <LinearProgress />
        ) : chestsToOpen.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No eligible chests in your inventory.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="center">Class</TableCell>
                  <TableCell align="center">Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chestsToOpen.map((chest) => (
                  <ChestRow key={chest.id} chest={chest} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Excluded Chests */}
      {excludedChests.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
            <BlockIcon fontSize="small" color="disabled" />
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.secondary"
            >
              Excluded (Core Chests)
            </Typography>
            <Chip
              label={`${excludedChests.reduce((s, c) => s + c.quantity, 0)} total`}
              size="small"
              variant="outlined"
            />
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="center">Class</TableCell>
                  <TableCell align="center">Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {excludedChests.map((chest) => (
                  <ChestRow key={chest.id} chest={chest} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Drop Summary */}
      <DropSummary
        summary={dropSummary}
        chestsOpened={chestsOpened}
        onClear={clearSummary}
        disabled={opening}
      />
    </Stack>
  );
}

export function ChestOpenerDialog({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1, pr: 6 }}
      >
        <AllInboxIcon fontSize="small" color="primary" />
        Open Chests
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        <ChestOpener />
      </DialogContent>
    </Dialog>
  );
}
