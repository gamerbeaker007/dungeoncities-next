"use client";

import type { DCMarketplaceListing } from "@/types/dc/marketplace";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BuyFn = (
  listingId: string,
  qty: number,
) => Promise<{ success: boolean; message?: string } | null>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return String(price);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type BuyDialogProps = {
  listing: DCMarketplaceListing | null;
  open: boolean;
  onClose: () => void;
  onBuy: BuyFn;
  /** Player's current DR balance. null = unknown (loading or not fetched). */
  druppleBalance: number | null;
};

export function BuyDialog({
  listing,
  open,
  onClose,
  onBuy,
  druppleBalance,
}: BuyDialogProps) {
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
  } | null>(null);

  if (!listing) return null;

  const maxQty = listing.quantity;
  const pricePerUnit = parseFloat(listing.pricePerUnit);
  const total = isNaN(pricePerUnit) ? 0 : pricePerUnit * qty;

  const insufficientFunds = druppleBalance !== null && total > druppleBalance;

  const handleBuy = async () => {
    setBuying(true);
    setResult(null);
    const res = await onBuy(String(listing.listingId), qty);
    setResult(res ?? { success: false, message: "No response from server." });
    setBuying(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {listing.item.imageUrl ? (
            <Box
              sx={{
                position: "relative",
                width: 56,
                height: 56,
                borderRadius: 1,
                overflow: "hidden",
                flexShrink: 0,
                bgcolor: "action.hover",
              }}
            >
              <Image
                src={listing.item.imageUrl}
                alt={listing.item.name}
                fill
                sizes="56px"
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </Box>
          ) : (
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 1,
                bgcolor: "action.hover",
                flexShrink: 0,
              }}
            />
          )}
          <Box>
            <Typography variant="h6" lineHeight={1.2}>
              {listing.item.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {listing.item.category}
              {listing.item.subCategory ? ` · ${listing.item.subCategory}` : ""}
              {listing.item.class ? ` · ${listing.item.class}-class` : ""}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Description */}
        {listing.item.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {listing.item.description}
          </Typography>
        )}

        {/* Seller + availability */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Seller
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {listing.seller.name}
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
              >
                {" · "}Lv {listing.seller.level}
              </Typography>
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary">
              Available qty
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {listing.quantity}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Price · qty stepper · total · DR balance */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 3,
            flexWrap: "wrap",
            mt: 1,
          }}
        >
          {/* Price per unit */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Price / unit
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatPrice(listing.pricePerUnit)}{" "}
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
              >
                {listing.currency}
              </Typography>
            </Typography>
          </Box>

          {/* Qty stepper */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mr: 0.5 }}
            >
              Qty
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1 || buying}
              sx={{ minWidth: 34, px: 0 }}
            >
              −
            </Button>
            <TextField
              size="small"
              type="number"
              value={qty}
              onChange={(e) => {
                const v = Math.max(
                  1,
                  Math.min(maxQty, parseInt(e.target.value) || 1),
                );
                setQty(v);
              }}
              disabled={buying}
              sx={{ width: 68 }}
              slotProps={{
                input: {
                  inputProps: {
                    min: 1,
                    max: maxQty,
                    style: { textAlign: "center" },
                  },
                },
              }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty || buying}
              sx={{ minWidth: 34, px: 0 }}
            >
              +
            </Button>
          </Box>

          {/* Total */}
          <Box sx={{ textAlign: "right", ml: "auto" }}>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
            <Typography
              variant="body1"
              fontWeight={700}
              color={insufficientFunds ? "error.main" : "primary.main"}
            >
              {total.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 3,
              })}{" "}
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
              >
                {listing.currency}
              </Typography>
            </Typography>
          </Box>
        </Box>

        {/* DR balance row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            mt: 0.75,
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Your DR balance:
          </Typography>
          {druppleBalance !== null ? (
            <Tooltip title="Drupple (DR) — in-game currency">
              <Typography
                variant="caption"
                fontWeight={600}
                color={insufficientFunds ? "error.main" : "success.main"}
              >
                {formatPrice(druppleBalance)} DR
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          )}
        </Box>

        {/* Insufficient funds warning */}
        {insufficientFunds && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            Insufficient DR balance. This purchase costs{" "}
            <strong>{formatPrice(total)} DR</strong> but you only have{" "}
            <strong>{formatPrice(druppleBalance!)} DR</strong>.
          </Alert>
        )}

        {/* Result feedback */}
        {result && (
          <Alert severity={result.success ? "success" : "error"} sx={{ mt: 2 }}>
            {result.success
              ? (result.message ?? "Purchase successful!")
              : (result.message ?? "Purchase failed.")}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={buying}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleBuy}
          disabled={buying || result?.success === true || insufficientFunds}
          startIcon={
            buying ? (
              <CircularProgress size={16} />
            ) : (
              <ShoppingCartIcon fontSize="small" />
            )
          }
        >
          {buying ? "Buying…" : `Buy ${qty}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
