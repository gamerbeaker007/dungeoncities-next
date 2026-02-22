import { formatDropQty } from "@/lib/format-utils";
import type { ResourceResult } from "@/types/resource";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

type ResourceCardProps = {
  result: ResourceResult;
};

export function ResourceCard({ result }: ResourceCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{ maxWidth: 400, height: "100%", overflow: "hidden" }}
    >
      <CardContent sx={{ minWidth: 0 }}>
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          <Typography variant="h6">
            {result.resourceName}
            {result.resourceId ? ` (#${result.resourceId})` : ""}
          </Typography>

          {result.nameWarning ? (
            <Stack spacing={0}>
              <Typography variant="body2" color="warning.main">
                Warning: original Unknown &quot;???&quot;
              </Typography>
              <Typography variant="caption" color="warning.main">
                {result.derivedItemName
                  ? "Using derived name instead"
                  : "No derived name available"}
              </Typography>
            </Stack>
          ) : null}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
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
            Location: {result.location}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Drop chance:{" "}
            {result.dropChance === 0
              ? "??"
              : `${result.dropChance ?? "Unknown"}` + "%"}
          </Typography>
          {result.dropChance !== 0 && (
            <Typography variant="body2" color="text.secondary">
              Drop Qty: {formatDropQty(result.minQuantity, result.maxQuantity)}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Kills: {result.totalKills} / Encounters: {result.totalEncounters}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
