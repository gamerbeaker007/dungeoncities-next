"use client";

import {
  getGameStateAction,
  getMarketplaceListingsAction,
  purchaseItemAction,
  updateLocationAction,
} from "@/actions/game-actions";
import { BuyDialog } from "@/components/market/buy-dialog";
import { formatPrice } from "@/components/market/item-section";
import { useMarket } from "@/hooks/use-market";
import { useAuth } from "@/providers/auth-provider";
import type { DCMarketplaceListing } from "@/types/dc/marketplace";
import type { ForgeRecipe } from "@/types/forge";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

interface WishlistBrowserProps {
  recipes: ForgeRecipe[];
}

interface IngredientGroup {
  prefix: string;
  items: Array<{ slot: string; owned: boolean; quantity: number }>;
}

interface CheckResult {
  setName: string;
  recipeCount: number;
  groups: IngredientGroup[];
  hasMissing: boolean;
}

// ---------------------------------------------------------------------------
// Set-prefix extraction helpers
// ---------------------------------------------------------------------------

/**
 * Builds the list of known set prefixes from recipe names (for the search box).
 * Handles both single-word ("Baneberry") and multi-word ("Glacier Lily",
 * "Phantom Flower") sets by checking per two-word group independently.
 * Result is sorted longest-first so two-word prefixes are matched first.
 */
function buildSetPrefixes(allRecipeNames: string[]): string[] {
  const nonKeys = allRecipeNames.filter(
    (n) => !n.includes(" Key ") && !n.startsWith("Key "),
  );

  // Count items per two-word prefix
  const twoWordCounts = new Map<string, number>();
  for (const name of nonKeys) {
    const words = name.split(" ");
    if (words.length >= 3) {
      const key = `${words[0]} ${words[1]}`;
      twoWordCounts.set(key, (twoWordCounts.get(key) ?? 0) + 1);
    }
  }
  // Any two-word prefix with >= 3 items is its own set
  const twoWordSets = new Set(
    [...twoWordCounts.entries()]
      .filter(([, n]) => n >= 3)
      .map(([prefix]) => prefix),
  );

  // Collect one-word prefixes for items NOT already covered by a two-word set
  const byFirstWord = new Map<string, string[]>();
  for (const name of nonKeys) {
    const first = name.split(" ")[0];
    const list = byFirstWord.get(first) ?? [];
    list.push(name);
    byFirstWord.set(first, list);
  }

  const oneWordSets: string[] = [];
  for (const [firstWord, names] of byFirstWord) {
    if (names.length < 3) continue;
    const allCoveredByTwoWord = names.every((n) => {
      const w = n.split(" ");
      return w.length >= 3 && twoWordSets.has(`${w[0]} ${w[1]}`);
    });
    if (!allCoveredByTwoWord) oneWordSets.push(firstWord);
  }

  return [...twoWordSets, ...oneWordSets].sort(
    (a, b) => b.length - a.length || a.localeCompare(b),
  );
}

/**
 * Find the one set prefix that contains the query string (case-insensitive).
 * Priority: exact match > starts-with > first contains match (longest wins ties).
 */
function findMatchingSetPrefix(
  query: string,
  setPrefixes: string[],
): string | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const matches = setPrefixes.filter((p) => p.toLowerCase().includes(q));
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  const exact = matches.find((p) => p.toLowerCase() === q);
  if (exact) return exact;
  const sw = matches.find((p) => p.toLowerCase().startsWith(q));
  return sw ?? matches[0];
}

/**
 * Given a single ingredient name and ALL ingredient names in the current set,
 * returns the longest word-prefix shared by >= 2 names so that "Ghost Orchid
 * Armguards" becomes prefix="Ghost Orchid", slot="Armguards".
 * Falls back to the full name when the item is unique (no shared prefix).
 */
function detectIngredientPrefix(
  name: string,
  allIngredientNames: string[],
): string {
  const words = name.split(" ");
  for (let len = words.length - 1; len >= 1; len--) {
    const prefix = words.slice(0, len).join(" ");
    const matchCount = allIngredientNames.filter(
      (n) => n === prefix || n.startsWith(prefix + " "),
    ).length;
    if (matchCount >= 2) return prefix;
  }
  return name; // singleton — use full name as its own group
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WishlistBrowser({ recipes }: WishlistBrowserProps) {
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const {
    itemQuantitiesByItemId,
    playerLoading,
    locationWarning,
    drubbleBalance,
    fetchPlayerItems,
  } = useMarket();

  const [setInput, setSetInput] = useState("");
  const [submittedSet, setSubmittedSet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOwned, setShowOwned] = useState(true);

  // Per-item market listings (keyed by full item name)
  const [itemListings, setItemListings] = useState<
    Record<string, DCMarketplaceListing[]>
  >({});
  const [marketLoading, setMarketLoading] = useState(false);
  const [buyListing, setBuyListing] = useState<DCMarketplaceListing | null>(
    null,
  );

  // Pre-compute helpers once from all recipes
  const { setPrefixes, recipeByItemId } = useMemo(() => {
    const names = recipes.map((r) => r.recipeName);
    const byId = new Map<number, ForgeRecipe>();
    for (const r of recipes) byId.set(r.recipeId, r);
    return { setPrefixes: buildSetPrefixes(names), recipeByItemId: byId };
  }, [recipes]);

  // Compute result whenever the submitted set name or item quantities change
  const result = useMemo((): CheckResult | null => {
    if (!submittedSet || playerLoading) return null;

    const matchedPrefix = findMatchingSetPrefix(submittedSet, setPrefixes);
    if (!matchedPrefix) return null;

    const setRecipes = recipes.filter((r) =>
      r.recipeName.toLowerCase().startsWith(matchedPrefix.toLowerCase() + " "),
    );
    if (setRecipes.length === 0) return null;

    // --- First pass: collect all (ingredientName, owned, quantity) tuples ---
    const rawIngredients: Array<{
      name: string;
      owned: boolean;
      quantity: number;
    }> = [];

    for (const recipe of setRecipes) {
      const recipeAlreadyCrafted =
        (itemQuantitiesByItemId[recipe.recipeId]?.total ?? 0) > 0;

      for (const req of recipe.requirements) {
        if (req.itemId === null) continue;

        const ingredientQuantity =
          itemQuantitiesByItemId[req.itemId]?.total ?? 0;
        const owned = recipeAlreadyCrafted || ingredientQuantity > 0;

        const ingredientRecipe = recipeByItemId.get(req.itemId);
        const ingredientName = ingredientRecipe?.recipeName ?? req.name;

        rawIngredients.push({
          name: ingredientName,
          owned,
          quantity: ingredientQuantity,
        });
      }
    }

    // --- Second pass: group by dynamically detected prefix ---
    const allIngNames = rawIngredients.map((i) => i.name);
    const byPrefix = new Map<
      string,
      Map<string, { owned: boolean; quantity: number }>
    >();

    for (const { name, owned, quantity } of rawIngredients) {
      const prefix = detectIngredientPrefix(name, allIngNames);
      const slot = prefix === name ? "" : name.slice(prefix.length + 1);

      const prefixMap =
        byPrefix.get(prefix) ??
        new Map<string, { owned: boolean; quantity: number }>();
      const existing = prefixMap.get(slot);
      // Only upgrade missing->owned, keep highest quantity seen
      if (!existing || owned) {
        prefixMap.set(slot, {
          owned,
          quantity: Math.max(existing?.quantity ?? 0, quantity),
        });
      }
      byPrefix.set(prefix, prefixMap);
    }

    const groups: IngredientGroup[] = [...byPrefix.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, slotMap]) => ({
        prefix: p,
        items: [...slotMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([slot, { owned, quantity }]) => ({ slot, owned, quantity })),
      }));

    const hasMissing = groups.some((g) => g.items.some((i) => !i.owned));

    return {
      setName: matchedPrefix,
      recipeCount: setRecipes.length,
      groups,
      hasMissing,
    };
  }, [
    submittedSet,
    itemQuantitiesByItemId,
    playerLoading,
    recipes,
    setPrefixes,
    recipeByItemId,
  ]);

  // Fetch cheapest market listing for each missing item.
  // ONE call per set-prefix (e.g. "Ghost Orchid") instead of one per item
  // to avoid rate limits. Results are distributed client-side by exact name.
  // Moves to IN_MARKETPLACE first when coming from IN_FORGE / IN_SHOP / etc.
  const fetchListingsForGroups = useCallback(
    async (groups: IngredientGroup[]) => {
      if (!token || groups.length === 0) return;
      setMarketLoading(true);
      try {
        // ── Ensure we're at the marketplace ──────────────────────────────
        const state = await getGameStateAction(token);
        const location = state?.state ?? "";
        if (location !== "IN_MARKETPLACE") {
          if (
            location === "IN_DUNGEON" ||
            location === "ENTERING_DUNGEON" ||
            location === "IN_COMBAT"
          ) {
            return; // can't auto-move; locationWarning already surfaces this
          }
          if (location !== "IN_CITY") {
            await updateLocationAction(token, "IN_CITY");
          }
          await updateLocationAction(token, "IN_MARKETPLACE");
        }

        // ── One call per group prefix ─────────────────────────────────────
        // Each prefix maps to multiple items; we fetch all listings for the
        // prefix and then match exactly by item name client-side.
        const next: Record<string, DCMarketplaceListing[]> = {};

        for (const { prefix, items } of groups) {
          const hasMissingInGroup = items.some((i) => !i.owned);
          if (!hasMissingInGroup) continue;

          const res = await getMarketplaceListingsAction(token, {
            search: prefix,
            sortBy: "price_asc",
            limit: 50,
          });
          const listings = res?.listings ?? [];

          // Distribute to each missing item by exact name match
          for (const { slot, owned } of items) {
            if (owned) continue;
            const fullName = slot ? `${prefix} ${slot}` : prefix;
            // Keep only listings whose item name exactly matches (case-insensitive)
            next[fullName] = listings.filter(
              (l) => l.item.name.toLowerCase() === fullName.toLowerCase(),
            );
          }
        }

        setItemListings(next);
      } finally {
        setMarketLoading(false);
      }
    },
    [token],
  );

  // Re-fetch market listings whenever the result (missing items) changes
  useEffect(() => {
    if (!result) {
      setItemListings({});
      return;
    }
    setItemListings({});
    void fetchListingsForGroups(result.groups);
  }, [result, fetchListingsForGroups]);

  const handleBuy = useCallback(
    async (listingId: string, qty: number) => {
      if (!token) return { success: false, message: "Not authenticated." };
      const res = await purchaseItemAction(token, listingId, qty);
      if (res?.success) {
        // Refresh player inventory & DR balance, then re-derive missing items
        void fetchPlayerItems();
      }
      return res;
    },
    [token, fetchPlayerItems],
  );

  const notFound = submittedSet !== null && !playerLoading && result === null;

  if (authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Alert severity="info">
        Please log in � your inventory is needed to find what you are missing.
      </Alert>
    );
  }

  const handleCheck = () => {
    const name = setInput.trim();
    if (!name) return;
    setSubmittedSet(name);
    setCopied(false);
  };

  const formatMessage = (res: CheckResult): string => {
    if (!res.hasMissing) {
      return `I have all ingredients to craft the full ${res.setName} set!`;
    }
    const lines = ["I'm looking for these items:"];
    for (const { prefix, items } of res.groups) {
      const visibleItems = showOwned ? items : items.filter((i) => !i.owned);
      if (visibleItems.length === 0) continue;
      lines.push(`\n${prefix}:`);
      for (const { slot, owned, quantity } of visibleItems) {
        const label = slot || prefix;
        const qty = owned && quantity > 1 ? ` (x${quantity})` : "";
        lines.push(owned ? `* ~~${label}${qty}~~` : `* ${label}`);
      }
    }
    return lines.join("\n");
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(formatMessage(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {locationWarning && (
        <Alert severity="warning" sx={{ py: 0.5 }}>
          {locationWarning}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={showOwned}
              onChange={(e) => setShowOwned(e.target.checked)}
              size="small"
            />
          }
          label="Show owned (strikethrough)"
        />

        {drubbleBalance !== null && (
          <Tooltip title="Your Drubble (DR) balance">
            <Chip
              icon={<StorefrontIcon sx={{ fontSize: "14px !important" }} />}
              label={`${formatPrice(drubbleBalance)} DR`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Tooltip>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          label="Set name"
          placeholder="e.g. Gravebloom"
          size="small"
          value={setInput}
          onChange={(e) => setSetInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCheck();
          }}
          sx={{ minWidth: 220 }}
        />
        <Button
          variant="contained"
          onClick={handleCheck}
          disabled={playerLoading || !setInput.trim()}
          startIcon={
            playerLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {playerLoading ? "Loading items..." : "Find Missing"}
        </Button>
      </Box>

      {notFound && (
        <Alert severity="error">
          No recipes found for &quot;{submittedSet}&quot;. Check the spelling
          and try again.
        </Alert>
      )}

      {result && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {result.recipeCount} recipes found for{" "}
            <strong>{result.setName}</strong>.
          </Typography>

          {!result.hasMissing ? (
            <Alert severity="success">
              You have all ingredients to craft the full {result.setName} set!
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                Ingredients needed - crossed out means you already own (owned in
                inventory/marketplace) or item not needed (already crafted):
              </Typography>
              {result.groups.map(({ prefix, items }) => {
                const visibleItems = showOwned
                  ? items
                  : items.filter((i) => !i.owned);
                if (visibleItems.length === 0) return null;
                return (
                  <Paper key={prefix} variant="outlined" sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      gutterBottom
                    >
                      {prefix}
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 3, listStyle: "none" }}>
                      {visibleItems.map(({ slot, owned, quantity }) => {
                        const label = slot || prefix;
                        const fullName = slot ? `${prefix} ${slot}` : prefix;
                        const listings = itemListings[fullName];
                        // Filter out own listings from cheapest
                        const cheapest = listings?.find((l) => l.quantity > 0);
                        return (
                          <li
                            key={slot}
                            style={{
                              paddingBottom: 6,
                              paddingTop: 2,
                              borderBottom: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              {/* Item name */}
                              <Typography
                                variant="body2"
                                sx={{
                                  textDecoration: owned
                                    ? "line-through"
                                    : "none",
                                  color: owned
                                    ? "text.disabled"
                                    : "text.primary",
                                  minWidth: 120,
                                }}
                              >
                                {label}
                                {owned && quantity > 1 && (
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{ ml: 0.5, color: "text.disabled" }}
                                  >
                                    (x{quantity})
                                  </Typography>
                                )}
                              </Typography>

                              {/* Market info for missing items */}
                              {!owned && (
                                <>
                                  {marketLoading && !listings ? (
                                    <CircularProgress
                                      size={12}
                                      sx={{ ml: 0.5 }}
                                    />
                                  ) : cheapest ? (
                                    <>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ mx: 0.5 }}
                                      >
                                        ·
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        color="primary.main"
                                      >
                                        {formatPrice(cheapest.pricePerUnit)}{" "}
                                        <Typography
                                          component="span"
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {cheapest.currency}
                                        </Typography>
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {cheapest.seller.name}
                                      </Typography>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={
                                          <ShoppingCartIcon
                                            sx={{ fontSize: 14 }}
                                          />
                                        }
                                        onClick={() => setBuyListing(cheapest)}
                                        sx={{
                                          py: 0.25,
                                          px: 1,
                                          minHeight: 0,
                                          fontSize: "0.7rem",
                                        }}
                                      >
                                        Buy
                                      </Button>
                                    </>
                                  ) : listings !== undefined ? (
                                    <Typography
                                      variant="caption"
                                      color="text.disabled"
                                      sx={{ ml: 0.5 }}
                                    >
                                      — not listed
                                    </Typography>
                                  ) : null}
                                </>
                              )}
                            </Box>
                          </li>
                        );
                      })}
                    </Box>
                  </Paper>
                );
              })}

              <Divider />

              <Typography variant="subtitle2" color="text.secondary">
                Copy-paste message:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography
                  component="pre"
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    m: 0,
                  }}
                >
                  {formatMessage(result)}
                </Typography>
              </Paper>
              <Tooltip
                title={
                  locationWarning
                    ? "Listed/expired items may not be included due to location"
                    : ""
                }
              >
                <span style={{ alignSelf: "flex-start" }}>
                  <Button
                    variant="outlined"
                    startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                    onClick={handleCopy}
                    color={copied ? "success" : "primary"}
                  >
                    {copied ? "Copied!" : "Copy to clipboard"}
                  </Button>
                </span>
              </Tooltip>
            </>
          )}
        </Box>
      )}
      <BuyDialog
        listing={buyListing}
        open={buyListing !== null}
        onClose={() => setBuyListing(null)}
        onBuy={handleBuy}
        drubbleBalance={drubbleBalance}
      />
    </Box>
  );
}
