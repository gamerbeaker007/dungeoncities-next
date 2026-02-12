import type { ResourceResult } from "@/types/resource";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

type ResourceCardProps = {
  result: ResourceResult;
};

export function ResourceCard({ result }: ResourceCardProps) {
  return (
    <Card variant="outlined" sx={{ maxWidth: 400, height: "100%", overflow: "hidden" }}>
      <CardContent sx={{ minWidth: 0 }}>
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
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

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: 1.5,
              minWidth: 0,
            }}
          >
            {result.itemImageUrl ? (
              <Box
                sx={{
                  width: "100%",
                  height: 140,
                  borderRadius: 1,
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <Box
                  component="img"
                  src={result.itemImageUrl}
                  alt={result.resourceName}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: 140,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No item image
                </Typography>
              </Box>
            )}

            {result.monsterImageUrl ? (
              <Box
                sx={{
                  width: "100%",
                  height: 140,
                  borderRadius: 1,
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <Box
                  component="img"
                  src={result.monsterImageUrl}
                  alt={result.monsterName}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: 140,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No monster image
                </Typography>
              </Box>
            )}
          </Box>

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
