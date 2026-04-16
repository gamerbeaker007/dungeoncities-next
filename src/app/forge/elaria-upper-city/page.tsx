import {
  getElariaUpperCityItemRecipes,
  getElariaUpperCityKeyRecipes,
  getElariaUpperCityRecipes,
} from "@/lib/forge-items";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Elaria Upper City Forge",
  description:
    "Browse and search Elaria Upper City forge recipes in Dungeon Cities.",
};

export default function ElariaUpperCityForgePage() {
  const totalRecipes = getElariaUpperCityRecipes().length;
  const keyCount = getElariaUpperCityKeyRecipes().length;
  const itemCount = getElariaUpperCityItemRecipes().length;

  const sections = [
    {
      key: "keys",
      label: "Dungeon Keys",
      href: "/forge/elaria-upper-city/keys",
      description: "Dungeon key recipes for Elaria Upper City.",
      count: keyCount,
    },
    {
      key: "items",
      label: "Items & Equipment",
      href: "/forge/elaria-upper-city/items",
      description:
        "Weapons, armour, shields, accessories and other equipment recipes.",
      count: itemCount,
    },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Elaria Upper City Forge
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {totalRecipes} recipes across keys and equipment. Browse by category:
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          <Link suppressHydrationWarning href="/forge">
            ← All cities
          </Link>
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {sections.map((section) => (
          <Card
            key={section.key}
            variant="outlined"
            sx={{ minWidth: { xs: "100%", sm: 260 }, flex: "1 1 260px" }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {section.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {section.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {section.count} recipes
              </Typography>
            </CardContent>
            <Box sx={{ px: 2, pb: 2 }}>
              <Link
                suppressHydrationWarning
                href={section.href}
                style={{ textDecoration: "none" }}
              >
                <Button variant="contained" size="small" fullWidth>
                  Browse {section.label}
                </Button>
              </Link>
            </Box>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
