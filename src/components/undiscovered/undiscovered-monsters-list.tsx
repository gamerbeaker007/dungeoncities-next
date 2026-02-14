"use client";

import type { UndiscoveredMonster } from "@/lib/monster-data";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";

type UndiscoveredMonstersListProps = {
  monsters: UndiscoveredMonster[];
};

export function UndiscoveredMonstersList({
  monsters,
}: UndiscoveredMonstersListProps) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Undiscovered Monsters
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monsters with unidentified items (???) that need further
          investigation.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          <Link suppressHydrationWarning href="/">
            Back to Resource Finder
          </Link>
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Showing {monsters.length} monster(s) with unidentified items
      </Typography>

      {monsters.length === 0 ? (
        <Typography variant="body1">
          All monsters are fully discovered! 🎉
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "stretch",
          }}
        >
          {monsters.map((monster) => (
            <Box
              key={monster.monsterId}
              sx={{
                flex: "1 1 200px",
                minWidth: { xs: "100%", sm: 200 },
                maxWidth: { xs: "100%", sm: 280 },
              }}
            >
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Stack spacing={1.5} alignItems="center">
                    {monster.monsterImageUrl ? (
                      <Box
                        component="img"
                        src={monster.monsterImageUrl}
                        alt={monster.monsterName}
                        sx={{
                          width: "100%",
                          maxWidth: 180,
                          height: 120,
                          objectFit: "cover",
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          maxWidth: 180,
                          height: 120,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "grey.200",
                          borderRadius: 1,
                        }}
                      >
                        <HelpOutlineIcon
                          sx={{ fontSize: 48, color: "grey.500" }}
                        />
                      </Box>
                    )}

                    <Typography variant="h6" align="center">
                      {monster.monsterName}
                    </Typography>

                    <Chip
                      label={`${monster.unidentifiedDropCount} unidentified ${
                        monster.unidentifiedDropCount === 1 ? "item" : "items"
                      }`}
                      size="small"
                      color="warning"
                    />

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                    >
                      {monster.location}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                    >
                      Kills: {monster.totalKills} / Encounters:{" "}
                      {monster.totalEncounters}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Stack>
  );
}
