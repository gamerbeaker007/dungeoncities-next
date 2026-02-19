import type { ForgeRecipePlayerInfo, ForgeRequirement } from "@/types/forge";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { ForgeItem } from "./forge-item";

type ForgeRecipeCardProps = {
  recipeName: string;
  description: string;
  recipeImageUrl: string | null;
  cost: number;
  costCurrency: string;
  requirements: ForgeRequirement[];
  playerInfo?: ForgeRecipePlayerInfo;
};

export function ForgeRecipeCard({
  recipeName,
  description,
  recipeImageUrl,
  cost,
  costCurrency,
  requirements,
  playerInfo,
}: ForgeRecipeCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        maxWidth: 400,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {playerInfo?.isCrafted ? (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            bgcolor: "success.main",
            color: "success.contrastText",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Crafted
          </Typography>
        </Box>
      ) : null}
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

          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary">
              Required Items
            </Typography>
            {requirements.map((requirement, index) => (
              <ForgeItem
                key={`${requirement.itemId ?? "na"}-${requirement.name}-${index}`}
                requirement={requirement}
                ownedData={playerInfo?.ownedData[index]}
                isMatchedTerm={requirement.matched ?? false}
              />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
