"use client";

import type { EquipmentSet, ParsedStat } from "@/types/forge";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";

type ForgeSetBrowserProps = {
  sets: EquipmentSet[];
  availableClasses: string[];
};

function formatStatValue(value: number): string {
  return value % 1 === 0 ? value.toLocaleString() : value.toFixed(1);
}

function StatChips({ stats }: { stats: ParsedStat[] }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {stats.map((s) => (
        <Chip
          key={s.name}
          label={`${s.name.replace("Base ", "")} +${formatStatValue(s.value)}`}
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.7rem" }}
        />
      ))}
    </Box>
  );
}

function SetCard({ set }: { set: EquipmentSet }) {
  return (
    <Accordion
      disableGutters
      defaultExpanded={false}
      sx={{
        border: 1,
        borderColor: "divider",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ bgcolor: "action.selected", px: 2, py: 0.5 }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            alignItems: "flex-start",
            width: "100%",
            pr: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {set.setName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {set.cityLabel}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 0.5,
              mt: 0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Total cost:{" "}
              <strong>
                {set.totalCraftCost.toLocaleString()} {set.costCurrency}
              </strong>
            </Typography>
            <StatChips stats={set.totalStats} />
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "28%", fontWeight: 600 }}>Slot</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Stats</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                Cost
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {set.items.map((item) => (
              <TableRow key={item.recipeId} hover>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {item.category}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{item.recipeName}</Typography>
                </TableCell>
                <TableCell>
                  <StatChips stats={item.stats} />
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Typography variant="caption">
                    {item.craftCost.toLocaleString()} {item.costCurrency}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
}

export function ForgeSetBrowser({
  sets,
  availableClasses,
}: ForgeSetBrowserProps) {
  const [activeClass, setActiveClass] = useState<string>("all");

  const filteredSets = useMemo(
    () =>
      activeClass === "all"
        ? sets
        : sets.filter((s) => s.itemClass === activeClass),
    [sets, activeClass],
  );

  // Group filtered sets by class
  const byClass = useMemo(() => {
    const map = new Map<string, EquipmentSet[]>();
    for (const s of filteredSets) {
      if (!map.has(s.itemClass)) map.set(s.itemClass, []);
      map.get(s.itemClass)!.push(s);
    }
    return map;
  }, [filteredSets]);

  // Group within each class by city
  const groupByCity = (classSets: EquipmentSet[]) => {
    const cityMap = new Map<string, EquipmentSet[]>();
    for (const s of classSets) {
      if (!cityMap.has(s.cityLabel)) cityMap.set(s.cityLabel, []);
      cityMap.get(s.cityLabel)!.push(s);
    }
    return cityMap;
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Equipment Sets
        </Typography>
        <Typography variant="body1" color="text.secondary">
          All forged equipment sets with their stats and total stat summaries,
          grouped by class.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Filter by class:
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          <Button
            variant={activeClass === "all" ? "contained" : "outlined"}
            onClick={() => setActiveClass("all")}
          >
            All
          </Button>
          {availableClasses.map((cls) => (
            <Button
              key={cls}
              variant={activeClass === cls ? "contained" : "outlined"}
              onClick={() => setActiveClass(cls)}
            >
              {cls}-Class
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {Array.from(byClass.entries()).map(([cls, classSets]) => {
        const byCityMap = groupByCity(classSets);
        return (
          <Box key={cls}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                borderBottom: 2,
                borderColor: "primary.main",
                pb: 0.5,
                mb: 2,
              }}
            >
              {cls}-Class
            </Typography>
            <Stack spacing={3}>
              {Array.from(byCityMap.entries()).map(([cityLabel, citySets]) => (
                <Box key={cityLabel}>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    gutterBottom
                    sx={{ mb: 1.5 }}
                  >
                    {cityLabel}
                  </Typography>
                  <Stack spacing={2}>
                    {citySets.map((set) => (
                      <SetCard key={`${set.city}-${set.setName}`} set={set} />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        );
      })}

      <Box>
        <Link href="/forge" style={{ textDecoration: "none" }}>
          <Button variant="text" size="small">
            ← Back to Forge
          </Button>
        </Link>
      </Box>
    </Stack>
  );
}
