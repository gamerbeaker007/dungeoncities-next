"use client";

import type { DCGameInventoryItem } from "@/types/dc/state";
import SellIcon from "@mui/icons-material/Sell";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { formatPrice } from "../market/item-section";

type SellConfirmDialogProps = {
  open: boolean;
  items: DCGameInventoryItem[];
  selling: boolean;
  onConfirmAction: () => void;
  onClose: () => void;
};

function ItemImage({
  imageUrl,
  name,
}: Readonly<{ imageUrl: string; name: string }>) {
  if (!imageUrl) {
    return (
      <Box
        sx={{
          width: 28,
          height: 28,
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
        width: 28,
        height: 28,
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
        sizes="28px"
        style={{ objectFit: "cover" }}
        unoptimized
      />
    </Box>
  );
}

export function SellConfirmDialog({
  open,
  items,
  selling,
  onConfirmAction,
  onClose,
}: Readonly<SellConfirmDialogProps>) {
  const totalValue = items.reduce(
    (sum, item) => sum + Number.parseFloat(item.item.sellPrice) * item.quantity,
    0,
  );

  return (
    <Dialog
      open={open}
      onClose={selling ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Sell {items.length} item{items.length === 1 ? "" : "s"}?
      </DialogTitle>

      <DialogContent dividers>
        <TableContainer sx={{ maxHeight: 320 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={36} />
                <TableCell>Item</TableCell>
                <TableCell align="right" width={50}>
                  Qty
                </TableCell>
                <TableCell align="right" width={90}>
                  Value
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((invItem) => (
                <TableRow key={invItem.id}>
                  <TableCell sx={{ p: 0.5, pl: 1 }}>
                    <ItemImage
                      imageUrl={invItem.item.imageUrl}
                      name={invItem.item.name}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      lineHeight={1.2}
                    >
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
                        parseFloat(invItem.item.sellPrice) * invItem.quantity,
                      )}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: 2,
            gap: 1,
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Estimated total:
          </Typography>
          <Typography variant="body1" fontWeight={700} color="primary.main">
            {formatPrice(totalValue)} DR
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={selling}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={onConfirmAction}
          disabled={selling || items.length === 0}
          startIcon={
            selling ? (
              <CircularProgress size={16} />
            ) : (
              <SellIcon fontSize="small" />
            )
          }
        >
          {selling
            ? "Selling..."
            : `Sell ${items.length} item${items.length === 1 ? "" : "s"}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
