import { ShopBrowser } from "@/components/shop/shop-browser";
import StoreIcon from "@mui/icons-material/Store";
import { Box, Container, Typography } from "@mui/material";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Shop",
  description: "Sell items from your inventory in Dungeon Cities.",
};

export default function ShopPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <StoreIcon color="primary" />
        <Typography variant="h5" fontWeight={600}>
          Shop
        </Typography>
      </Box>
      <ShopBrowser />
    </Container>
  );
}
