import { updateLocationAction } from "@/actions/game-actions";
import type { DCGameLocation } from "@/types/dc/state";

/**
 * Moves the player to a target location, going through IN_CITY first if needed.
 * Returns an error message string, or null on success.
 */
async function moveToLocation(
  token: string,
  currentLocation: string,
  target: DCGameLocation,
  label: string,
): Promise<string | null> {
  if (currentLocation === target) return null;
  if (
    currentLocation === "IN_DUNGEON" ||
    currentLocation === "ENTERING_DUNGEON" ||
    currentLocation === "IN_COMBAT"
  ) {
    return `You are currently in a dungeon or combat. Please exit manually first — leaving a dungeon costs stamina (EXIT_DUNGEON costs 2% stamina).`;
  }
  if (currentLocation !== "IN_CITY") {
    const toCityResult = await updateLocationAction(token, "IN_CITY");
    if (!toCityResult?.success)
      return `Unable to leave current location: ${currentLocation}`;
  }
  const moveResult = await updateLocationAction(token, target);
  return moveResult?.success ? null : `Unable to move to ${label}.`;
}

export function moveToMarketplace(
  token: string,
  currentLocation: string,
): Promise<string | null> {
  return moveToLocation(
    token,
    currentLocation,
    "IN_MARKETPLACE",
    "marketplace",
  );
}

export function moveToShop(
  token: string,
  currentLocation: string,
): Promise<string | null> {
  return moveToLocation(token, currentLocation, "IN_SHOP", "shop");
}
