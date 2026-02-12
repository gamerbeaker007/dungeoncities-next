import { Box, Typography } from "@mui/material";

const staminaCosts = [
  { action: "START_BATTLE", cost: 2 },
  { action: "USE_SKILL", cost: 0 },
  { action: "PERFORM_TURN", cost: 0 },
  { action: "PERFORM_BATTLE_SEGMENT", cost: 0 },
  { action: "RUN", cost: 5 },
  { action: "MOVE_LEFT", cost: 1 },
  { action: "MOVE_RIGHT", cost: 1 },
  { action: "MOVE_STRAIGHT", cost: 1 },
  { action: "ENTER_DUNGEON", cost: 1 },
  { action: "EXIT_DUNGEON", cost: 2 },
  { action: "ENTER_SHOP", cost: 0 },
  { action: "EXIT_SHOP", cost: 0 },
  { action: "ENTER_FORGE", cost: 0 },
  { action: "EXIT_FORGE", cost: 0 },
  { action: "ENTER_GUILD_HALL", cost: 0 },
  { action: "EXIT_GUILD_HALL", cost: 0 },
  { action: "ENTER_NEXT_FLOOR", cost: 1 },
  { action: "COLLECT_ITEM", cost: 0 },
  { action: "OPEN_CHEST", cost: 0 },
  { action: "ENTER_ARENA", cost: 0 },
  { action: "EXIT_ARENA", cost: 0 },
];

const counterAttackRates = [
  { rank: "F", min: 5, max: 10 },
  { rank: "E", min: 7, max: 14 },
  { rank: "D", min: 10, max: 20 },
  { rank: "C", min: 14, max: 28 },
  { rank: "B", min: 19, max: 38 },
  { rank: "A", min: 25, max: 50 },
  { rank: "S", min: 30, max: 60 },
  { rank: "SS", min: 35, max: 70 },
  { rank: "SSS", min: 40, max: 80 },
  { rank: "R", min: 50, max: 100 },
];

const cityNames: Record<number, string> = {
  1: "Aldoria",
  2: "Brighthollow",
  3: "Caelum",
  4: "Druantia",
  5: "Eria",
};

const travelCosts = [
  { fromCity: 1, toCity: 2, cost: 2000 },
  { fromCity: 1, toCity: 3, cost: 2000 },
  { fromCity: 1, toCity: 4, cost: 2000 },
  { fromCity: 1, toCity: 5, cost: 2000 },
  { fromCity: 2, toCity: 3, cost: 2000 },
  { fromCity: 2, toCity: 4, cost: 2000 },
  { fromCity: 2, toCity: 5, cost: 2000 },
  { fromCity: 3, toCity: 4, cost: 2000 },
  { fromCity: 3, toCity: 5, cost: 2000 },
  { fromCity: 4, toCity: 5, cost: 2000 },
];

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
            {staminaCosts.map((row) => (
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
            {counterAttackRates.map((row) => (
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
            {travelCosts.map((row) => (
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
                  {row.fromCity} ({cityNames[row.fromCity]}) → {row.toCity} (
                  {cityNames[row.toCity]})
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
