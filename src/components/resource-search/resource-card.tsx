import type { ResourceResult } from "@/types/resource";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

type ResourceCardProps = {
  result: ResourceResult;
};

export function ResourceCard({ result }: ResourceCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6">
            {result.resourceName}
            {result.resourceId ? ` (#${result.resourceId})` : ""}
          </Typography>

          {result.nameWarning ? (
            <Typography variant="body2" color="warning.main">
              Warning: original Unknown &quot;???&quot;
              {result.derivedItemName
                ? " — using derived name instead"
                : " — no derived name available"}
            </Typography>
          ) : null}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            {result.itemImageUrl ? (
              <Box
                component="img"
                src={result.itemImageUrl}
                alt={result.resourceName}
                sx={{
                  width: "100%",
                  maxWidth: { sm: 180 },
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 1,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: { sm: 180 },
                  height: 140,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No item image
                </Typography>
              </Box>
            )}

            {result.monsterImageUrl ? (
              <Box
                component="img"
                src={result.monsterImageUrl}
                alt={result.monsterName}
                sx={{
                  width: "100%",
                  maxWidth: { sm: 180 },
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 1,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: { sm: 180 },
                  height: 140,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No monster image
                </Typography>
              </Box>
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Monster: {result.monsterName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            First discovered: {result.location}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Drop chance: {result.dropChance ?? "Unknown"}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
