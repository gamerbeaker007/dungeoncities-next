import type { DCGameInventoryItem, DCItem } from "@/types/dc/items";

export type {
  DCGameInventoryItem,
  DCInventoryItem,
  DCItem,
  DCItemStats,
} from "@/types/dc/items";

export type DCGameStateRequiredData = {
  character?: {
    inventorySize?: number;
  };
  inventory: DCGameInventoryItem[];
};

export type DCGameStateResponse = {
  state: string;
  stateData: unknown;
  requiredData: DCGameStateRequiredData;
  timestamp: number;
};

export type DCMarketListingStatus = "LISTED" | "EXPIRED" | "SOLD" | "CANCELLED";

export type DCMarketSortBy =
  | "date_desc"
  | "date_asc"
  | "price_desc"
  | "price_asc";

export type DCGetMyListingsParams = {
  status?: DCMarketListingStatus;
  limit: number;
  offset: number;
  minPrice: number;
  maxPrice: number;
  sortBy: DCMarketSortBy;
};

export type DCGetMyListingsPayload = {
  action: "GET_MY_LISTINGS";
  params: DCGetMyListingsParams;
};

export type DCMarketListing = {
  id: string;
  listingId: number;
  sellerCharacterId: number;
  itemId: number;
  inventoryItemId: string | null;
  quantity: number;
  pricePerUnit: string;
  totalPrice: string;
  currency: string;
  status: DCMarketListingStatus;
  enhancement: unknown;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  buyerCharacterId: number | null;
  completedAt: string | null;
  version: number;
  item: DCItem;
  seller: {
    id: string;
    characterId: number;
    userId: string;
    name: string;
    currentState: string;
  };
};

export type DCSlotUsage = {
  used: number;
  max: number;
  available: number;
  percentUsed: number;
  status: string;
};

export type DCGameLocation =
  | "IN_CITY"
  | "IN_MARKETPLACE"
  | "IN_DUNGEON"
  | "IN_FORGE"
  | string;

export type DCUpdateLocationResponse = {
  success: boolean;
  state?: DCGameLocation;
  error?: string;
  message?: string;
};

export type DCGetMyListingsResponse = {
  success: boolean;
  listings: DCMarketListing[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  slotUsage: DCSlotUsage;
};
