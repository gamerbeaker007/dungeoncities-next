import {
  getBrighthollowRecipes,
  getDruantiaRecipes,
  getElariaLowerCityRecipes,
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
  title: "Forge Search",
  description: "Search forge recipes and required resources in Dungeon Cities.",
};

const cities = [
  {
    key: "brighthollow",
    label: "Brighthollow",
    href: "/forge/brighthollow",
    description: "Dungeon key recipes for Brighthollow.",
    count: getBrighthollowRecipes().length,
  },
  {
    key: "druantia",
    label: "Druantia",
    href: "/forge/druantia",
    description: "Dungeon key recipes for Druantia.",
    count: getDruantiaRecipes().length,
  },
  {
    key: "elaria",
    label: "Elaria Lower City",
    href: "/forge/elaria-lower-city",
    description: "Keys, weapons, armour, accessories and more.",
    count: getElariaLowerCityRecipes().length,
  },
  {
    key: "elaria-upper",
    label: "Elaria Upper City",
    href: "/forge/elaria-upper-city",
    description: "Keys, weapons, armour, accessories and more.",
    count: getElariaUpperCityRecipes().length,
  },
];

export default function ForgePage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Forge Search
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a city to browse its forge recipes.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {cities.map((city) => (
          <Card
            key={city.key}
            variant="outlined"
            sx={{ minWidth: { xs: "100%", sm: 260 }, flex: "1 1 260px" }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {city.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {city.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {city.count} recipes
              </Typography>
            </CardContent>
            <Box sx={{ px: 2, pb: 2 }}>
              <Link
                suppressHydrationWarning
                href={city.href}
                style={{ textDecoration: "none" }}
              >
                <Button variant="contained" size="small" fullWidth>
                  Browse {city.label}
                </Button>
              </Link>
            </Box>
          </Card>
        ))}
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Equipment Sets
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          View all equipment sets with full stat breakdowns and totals, grouped
          by class.
        </Typography>
        <Link href="/forge/sets" style={{ textDecoration: "none" }}>
          <Button variant="outlined">Browse Equipment Sets</Button>
        </Link>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Crafting Path
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          See the full step-by-step crafting chain to reach any S-Class set —
          which items to forge first and in which city.
        </Typography>
        <Link href="/forge/crafting-path" style={{ textDecoration: "none" }}>
          <Button variant="outlined">View Crafting Paths</Button>
        </Link>
      </Box>
    </Stack>
  );
}
