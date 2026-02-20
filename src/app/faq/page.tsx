import {
  CITY_NAMES,
  COUNTER_ATTACK_RATES,
  STAMINA_COSTS,
  TRAVEL_COSTS,
} from "@/lib/faq-data";
import { Box, Typography } from "@mui/material";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Stamina costs, counter attack rates, and travel costs for Dungeon Cities.",
};

export default function FaqPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        FAQ
      </Typography>

      <Box sx={{ display: "grid", gap: 4 }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Stamina Cost
          </Typography>
          <Box>
            {STAMINA_COSTS.map((row) => (
              <Box
                key={row.action}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, auto) auto",
                  columnGap: 2,
                  alignItems: "center",
                  py: 0.5,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">{row.action}</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {row.cost}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Counter Attack
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All values below are percent (%).
          </Typography>
          <Box>
            {COUNTER_ATTACK_RATES.map((row) => (
              <Box
                key={row.rank}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, auto) auto",
                  columnGap: 2,
                  alignItems: "center",
                  py: 0.5,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">Class {row.rank}</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {row.min}% - {row.max}%
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Every monster has a 5% chance to do a counter, and the damage dealt
            is based on your attack power/damage.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Travel Cost
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Currently All travel costs are 2000 DR.
          </Typography>
          <Box>
            {TRAVEL_COSTS.map((row) => (
              <Box
                key={`${row.fromCity}-${row.toCity}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, auto) auto",
                  columnGap: 2,
                  alignItems: "center",
                  py: 0.5,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">
                  {row.fromCity} ({CITY_NAMES[row.fromCity]}) → {row.toCity} (
                  {CITY_NAMES[row.toCity]})
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {row.cost} DR
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
}
