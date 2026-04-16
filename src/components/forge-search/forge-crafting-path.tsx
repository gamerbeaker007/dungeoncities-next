"use client";

import type {
  ChainBaseInput,
  CraftingChain,
  CraftingChainSlot,
  CraftingStep,
} from "@/types/forge";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";

const CITY_COLOR: Record<string, string> = {
  "Elaria Lower City": "primary.main",
  "Elaria Upper City": "secondary.main",
};

function CityBadge({ cityLabel }: { cityLabel: string }) {
  const color = CITY_COLOR[cityLabel] ?? "text.secondary";
  return (
    <Chip
      label={cityLabel}
      size="small"
      sx={{
        bgcolor: color,
        color: "white",
        fontWeight: 600,
        fontSize: "0.68rem",
      }}
    />
  );
}

function BaseInputs({ inputs }: { inputs: ChainBaseInput[] }) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        p: 1.5,
        bgcolor: "action.hover",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mb: 1 }}
      >
        Requires these A-Class items (craft or buy from market):
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {inputs.map((inp) => (
          <Tooltip key={inp.recipeId} title={inp.cityLabel} placement="top">
            <Chip
              label={inp.itemName}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
}

function StepCard({
  step,
  stepNumber,
  totalSteps,
}: {
  step: CraftingStep;
  stepNumber: number;
  totalSteps: number;
}) {
  const isFinal = stepNumber === totalSteps;
  return (
    <Box
      sx={{
        border: 2,
        borderColor: isFinal ? "primary.main" : "divider",
        borderRadius: 1,
        p: 1.5,
        bgcolor: isFinal ? "action.selected" : "background.paper",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box
          sx={{
            minWidth: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: isFinal ? "primary.main" : "action.disabledBackground",
            color: isFinal ? "primary.contrastText" : "text.secondary",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "0.75rem",
            flexShrink: 0,
          }}
        >
          {stepNumber}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              {step.itemName}
            </Typography>
            <Chip
              label={`${step.itemClass}-Class`}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.65rem" }}
            />
            <CityBadge cityLabel={step.cityLabel} />
          </Box>

          <Box sx={{ mt: 0.75, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {step.craftedInputs.map((ci) => (
              <Chip
                key={ci.itemId ?? ci.name}
                label={ci.name}
                size="small"
                color="default"
                sx={{ fontSize: "0.68rem" }}
              />
            ))}
            {step.sideInputs.map((si) => (
              <Chip
                key={si.itemId ?? si.name}
                label={`${si.quantity > 1 ? `${si.quantity}× ` : ""}${si.name}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.68rem", borderStyle: "dashed" }}
              />
            ))}
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: "block" }}
          >
            Craft cost: {step.cost.toLocaleString()} {step.costCurrency}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function SlotChain({ slot }: { slot: CraftingChainSlot }) {
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
        sx={{ bgcolor: "action.selected", px: 2 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {slot.category}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {slot.steps.length} crafting step
            {slot.steps.length !== 1 ? "s" : ""}
            {slot.baseInputs.length > 0
              ? ` · ${slot.baseInputs.length} A-Class base item${slot.baseInputs.length !== 1 ? "s" : ""}`
              : ""}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total:{" "}
            <strong>
              {slot.steps
                .reduce((s, step) => s + step.cost, 0)
                .toLocaleString()}{" "}
              {slot.steps[0]?.costCurrency ?? "DRUBBLE"}
            </strong>
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 2 }}>
        <Stack spacing={0}>
          {slot.baseInputs.length > 0 && (
            <>
              <BaseInputs inputs={slot.baseInputs} />
              <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                <ArrowDownwardIcon fontSize="small" color="disabled" />
              </Box>
            </>
          )}

          {slot.steps.map((step, idx) => (
            <Box key={step.recipeId}>
              <StepCard
                step={step}
                stepNumber={idx + 1}
                totalSteps={slot.steps.length}
              />
              {idx < slot.steps.length - 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                  <ArrowDownwardIcon fontSize="small" color="disabled" />
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

type Props = {
  chains: CraftingChain[];
  setNames: string[];
};

export function ForgeCraftingPath({ chains, setNames }: Props) {
  const [selectedSet, setSelectedSet] = useState<string>(setNames[0] ?? "");

  const chain = useMemo(
    () => chains.find((c) => c.setName === selectedSet) ?? null,
    [chains, selectedSet],
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Crafting Path
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Shows the full step-by-step crafting chain to reach any S-Class
          equipment set — which items to craft first, and which city to forge
          them in.
        </Typography>
      </Box>

      <FormControl size="small" sx={{ maxWidth: 360 }}>
        <InputLabel id="set-select-label">Equipment Set</InputLabel>
        <Select
          labelId="set-select-label"
          value={selectedSet}
          label="Equipment Set"
          onChange={(e) => setSelectedSet(e.target.value)}
        >
          {setNames.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {chain && (
        <>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">{chain.setName} set</Typography>
            <Chip
              sx={{ bgcolor: CITY_COLOR["Elaria Lower City"], color: "white" }}
              size="small"
              label="Elaria Lower City"
            />
            <Chip
              sx={{ bgcolor: CITY_COLOR["Elaria Upper City"], color: "white" }}
              size="small"
              label="Elaria Upper City"
            />
          </Box>

          <Box
            sx={{
              p: 1.5,
              bgcolor: "action.hover",
              borderRadius: 1,
              borderLeft: 4,
              borderColor: "info.main",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>How to read this:</strong> Each slot (Weapon, Shield,
              etc.) shows its individual chain. Solid chips are crafted inputs
              from the previous step; dashed chips are raw side materials (e.g.
              Convergence Stones). Click a slot to expand it.
            </Typography>
          </Box>

          <Divider />

          <Stack spacing={1}>
            {chain.slots.map((slot) => (
              <SlotChain key={slot.category} slot={slot} />
            ))}
          </Stack>
        </>
      )}

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
