import {
  CITY_FLOORS,
  CITY_NAMES,
  COUNTER_ATTACK_RATES,
  KNOWN_ALTAR_LOCATIONS,
  STAMINA_COSTS,
  TRAVEL_COSTS,
} from "@/lib/faq-data";
import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Stamina costs, counter attack rates, and travel costs for Dungeon Cities.",
};

function DataRow({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        py: 0.5,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="body2">{left}</Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ whiteSpace: "nowrap" }}
      >
        {right}
      </Typography>
    </Box>
  );
}

export default function FaqPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        FAQ
      </Typography>

      {/* Top row — small reference cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
          gap: 2,
          mb: 2,
        }}
      >
        {/* Stamina Cost */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              Stamina Cost
            </Typography>
            {STAMINA_COSTS.map((row) => (
              <DataRow
                key={row.action}
                left={row.action}
                right={`${row.cost}%`}
              />
            ))}
          </CardContent>
        </Card>

        {/* Counter Attack */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              Counter Attack
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 1 }}
            >
              All values are percent (%). Every monster has a 5% chance to
              counter; damage is based on your ATK.
            </Typography>
            {COUNTER_ATTACK_RATES.map((row) => (
              <DataRow
                key={row.rank}
                left={`Class ${row.rank}`}
                right={`${row.min}% – ${row.max}%`}
              />
            ))}
          </CardContent>
        </Card>

        {/* Travel Cost */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              Travel Cost
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 1 }}
            >
              All travel costs are 2000 DR.
            </Typography>
            {TRAVEL_COSTS.map((row) => (
              <DataRow
                key={`${row.fromCity}-${row.toCity}`}
                left={`${CITY_NAMES[row.fromCity]} → ${CITY_NAMES[row.toCity]}`}
                right={`${row.cost} DR`}
              />
            ))}
          </CardContent>
        </Card>
      </Box>

      {/* Altars — full width, two sub-sections */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
        }}
      >
        {/* Known Altar Locations */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" display="block">
              Altars
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 1.5, whiteSpace: "pre-line" }}
            >
              {`Buy an E class core from the exclusive shop for DCXT (1 DCXT = 200 DR).
              DR must be on Hive-Engine.
              Then ascend it to a higher class at an Altar.
              Encounter chance: 3%–6% per floor.
              `}
            </Typography>

            <Typography variant="h6" component="h2" gutterBottom>
              Known Altar Locations
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              {CITY_FLOORS.map((cityRow) => {
                const cityName = CITY_NAMES[cityRow.cityId];
                const altars = KNOWN_ALTAR_LOCATIONS.filter(
                  (a) => a.cityId === cityRow.cityId,
                );
                return (
                  <Box key={cityRow.cityId}>
                    <Typography variant="subtitle2" gutterBottom>
                      {cityName}
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 0.5 }}
                      >
                        ({cityRow.floors} floors)
                      </Typography>
                    </Typography>
                    {altars.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        No locations recorded yet.
                      </Typography>
                    ) : (
                      altars.map((altar) => (
                        <Box
                          key={`${altar.cityId}-${altar.floor}`}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "60px 1fr",
                            columnGap: 1,
                            alignItems: "start",
                            py: 0.4,
                            borderBottom: 1,
                            borderColor: "divider",
                          }}
                        >
                          <Typography variant="caption" fontWeight={600}>
                            Floor {altar.floor}
                          </Typography>
                          <Typography variant="caption">
                            {altar.description}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
