"use client";

import { MonsterDropsDialog } from "@/components/undiscovered/monster-drops-dialog";
import { formatMonsterLocation } from "@/lib/format-utils";
import type { MonsterDiscoveryListItem } from "@/lib/monster-data";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";

type UndiscoveredMonstersListProps = {
  monsters: MonsterDiscoveryListItem[];
};

export function UndiscoveredMonstersList({
  monsters,
}: UndiscoveredMonstersListProps) {
  const [selectedMonster, setSelectedMonster] =
    useState<MonsterDiscoveryListItem | null>(null);

  const lowKillNotDiscovered = useMemo(
    () => monsters.filter((monster) => !monster.discovered),
    [monsters],
  );

  const midKillNotFullyDiscovered = useMemo(
    () =>
      monsters.filter(
        (monster) => monster.discovered && !monster.fullyDiscovered,
      ),
    [monsters],
  );

  const fullyDiscovered = useMemo(
    () => monsters.filter((monster) => monster.fullyDiscovered),
    [monsters],
  );

  const renderMonsterGrid = (
    groupMonsters: MonsterDiscoveryListItem[],
    emptyMessage: string,
  ) => {
    if (groupMonsters.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      );
    }

    return (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "stretch",
        }}
      >
        {groupMonsters.map((monster) => (
          <Box
            key={monster.monsterId}
            sx={{
              flex: "1 1 200px",
              minWidth: { xs: "100%", sm: 200 },
              maxWidth: { xs: "100%", sm: 280 },
            }}
          >
            <Card
              variant="outlined"
              sx={{ height: "100%", cursor: "pointer" }}
              onClick={() => setSelectedMonster(monster)}
            >
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
                    color={monster.fullyDiscovered ? "success" : "warning"}
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    {formatMonsterLocation(monster.firstEncounter)}
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
    );
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Monster Discovery Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monsters grouped by kills and discovery progress.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          <Link suppressHydrationWarning href="/">
            Back to Resource Finder
          </Link>
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Total monsters tracked: {monsters.length}
      </Typography>

      <Stack spacing={1}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Basic Not Discovered ({lowKillNotDiscovered.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderMonsterGrid(
              lowKillNotDiscovered,
              "No monsters in this group.",
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Not Fully Discovered ({midKillNotFullyDiscovered.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderMonsterGrid(
              midKillNotFullyDiscovered,
              "No monsters in this group.",
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Fully Discovered ({fullyDiscovered.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderMonsterGrid(
              fullyDiscovered,
              "No fully discovered monsters yet.",
            )}
          </AccordionDetails>
        </Accordion>
      </Stack>

      <MonsterDropsDialog
        monster={selectedMonster}
        onClose={() => setSelectedMonster(null)}
      />
    </Stack>
  );
}
