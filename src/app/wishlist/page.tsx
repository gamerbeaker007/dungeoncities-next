import { WishlistBrowser } from "@/components/wishlist/wishlist-browser";
import { getForgeRecipes } from "@/lib/forge-items";
import { Container, Typography } from "@mui/material";

export const dynamic = "force-static";

export default function WishlistPage() {
  const recipes = getForgeRecipes();

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Set Wishlist
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter equipment set names to find which items you are missing. The
        result is formatted to paste directly into a chat message.
      </Typography>
      <WishlistBrowser recipes={recipes} />
    </Container>
  );
}
