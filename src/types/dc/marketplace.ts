import type { DCItem } from "@/types/dc/items";

export type DCMarketplaceSortBy =
  | "date_desc"
  | "date_asc"
  | "price_desc"
  | "price_asc";

export type DCGetMarketplaceListingsParams = {
  minPrice?: number;
  maxPrice?: number;
  sortBy?: DCMarketplaceSortBy;
  search?: string;
  /** Item class filter, e.g. "A", "B", ... "SSS". Omit or pass undefined for all classes. */
  class?: string;
  /** Subcategory filter, e.g. "Plant", "Weapon". Omit or pass undefined for all. */
  subcategory?: string;
  limit?: number;
  offset?: number;
};

export type DCMarketplaceSeller = {
  id: string;
  characterId: number;
  userId: string;
  name: string;
  level: number;
  currentState: string;
  avatar: {
    name: string;
    imageUrl: string;
    isDefault: boolean;
  };
};

export type DCMarketplaceListing = {
  id: string;
  listingId: number;
  sellerCharacterId: number;
  itemId: number;
  inventoryItemId: string | null;
  quantity: number;
  pricePerUnit: string;
  totalPrice: string;
  currency: string;
  status: string;
  enhancement: unknown;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  buyerCharacterId: number | null;
  completedAt: string | null;
  version: number;
  item: DCItem;
  seller: DCMarketplaceSeller;
};

export type DCGetMarketplaceListingsResponse = {
  success: boolean;
  listings: DCMarketplaceListing[];
  total: number;
};

export type DCPurchaseItemParams = {
  listingId: string;
  quantity: number;
};

export type DCPurchaseItemResponse = {
  success: boolean;
  message?: string;
};
