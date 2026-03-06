import { MarketBrowser } from "@/components/market/market-browser";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Box, Container, Typography } from "@mui/material";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Browse live marketplace listings in Dungeon Cities.",
};

export default function MarketPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <StorefrontIcon color="primary" />
        <Typography variant="h5" fontWeight={600}>
          Marketplace
        </Typography>
      </Box>
      <MarketBrowser />
    </Container>
  );
}
