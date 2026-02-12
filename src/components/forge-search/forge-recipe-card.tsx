import type { ForgeRequirement } from "@/types/forge";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

type ForgeRecipeCardProps = {
  recipeName: string;
  description: string;
  recipeImageUrl: string | null;
  cost: number;
  costCurrency: string;
  matchedRequirements: ForgeRequirement[];
  otherRequirements: ForgeRequirement[];
};

function RequirementLinks({
  requirements,
  title,
}: {
  requirements: ForgeRequirement[];
  title: string;
}) {
  if (requirements.length === 0) {
    return null;
  }

  return (
    <Stack spacing={0.75}>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      {requirements.map((requirement) => (
        <Stack
          key={`${requirement.itemId ?? "na"}-${requirement.name}`}
          direction="row"
          spacing={1}
          alignItems="center"
        >
          {requirement.imageUrl ? (
            <Box
              component="img"
              src={requirement.imageUrl}
              alt={requirement.name}
              sx={{
                width: 28,
                height: 28,
                objectFit: "cover",
                borderRadius: 0.5,
              }}
            />
          ) : null}

          <Typography variant="body2">
            {requirement.quantity}x{" "}
            <Link suppressHydrationWarning href={requirement.searchHref}>
              {requirement.name}
            </Link>
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export function ForgeRecipeCard({
  recipeName,
  description,
  recipeImageUrl,
  cost,
  costCurrency,
  matchedRequirements,
  otherRequirements,
}: ForgeRecipeCardProps) {
  return (
    <Card variant="outlined" sx={{  maxWidth: 400, height: "100%", overflow: "hidden" }}>
      <CardContent>
        <Stack spacing={0.5}>
          <Typography variant="h6">{recipeName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>

          {recipeImageUrl ? (
            <Box
              component="img"
              src={recipeImageUrl}
              alt={recipeName}
              sx={{
                width: "100%",
                maxWidth: 220,
                height: 140,
                objectFit: "cover",
                borderRadius: 1,
              }}
            />
          ) : null}

          <Typography variant="body2" color="text.secondary">
            Cost: {cost} {costCurrency}
          </Typography>

          <Divider />

          <RequirementLinks
            requirements={matchedRequirements}
            title="Item needed (search term match)"
          />
          <RequirementLinks
            requirements={otherRequirements}
            title="Items needed"
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
