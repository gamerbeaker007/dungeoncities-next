"use server";

import {
  getAllMarketListingsData,
  getMarketInfoData,
  getMarketplaceListingsData,
  getStateData,
  purchaseItemData,
  sellItemData,
  updateLocationData,
} from "@/lib/dc-api";
import {
  DCGetMarketplaceListingsParams,
  DCGetMarketplaceListingsResponse,
  DCPurchaseItemResponse,
} from "@/types/dc/marketplace";
import { DCSellItemParams, DCSellItemResponse } from "@/types/dc/shop";
import {
  DCGameLocation,
  DCGameStateResponse,
  DCGetMyListingsParams,
  DCGetMyListingsResponse,
  DCUpdateLocationResponse,
} from "@/types/dc/state";

export async function getGameStateAction(
  token: string,
): Promise<DCGameStateResponse | null> {
  if (!token) {
    return null;
  }

  try {
    return await getStateData({ token });
  } catch (error) {
    console.error("getGameStateAction failed", error);
    return null;
  }
}

export async function validateGameTokenAction(token: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  const state = await getGameStateAction(token);
  return state !== null;
}

export async function updateLocationAction(
  token: string,
  targetLocation: DCGameLocation,
): Promise<DCUpdateLocationResponse | null> {
  if (!token) {
    return null;
  }

  try {
    return await updateLocationData({ token }, targetLocation);
  } catch (error) {
    console.error("updateLocationAction failed", { targetLocation, error });
    return null;
  }
}

export async function getMarketInfoAction(
  token: string,
  params: DCGetMyListingsParams,
): Promise<DCGetMyListingsResponse | null> {
  if (!token) {
    return null;
  }

  try {
    return await getMarketInfoData({ token }, params);
  } catch (error) {
    console.error("getMarketInfoAction failed", { params, error });
    return null;
  }
}

type GetAllMarketListingsActionOptions = {
  status?: DCGetMyListingsParams["status"];
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: DCGetMyListingsParams["sortBy"];
};

export async function getAllMarketListingsAction(
  token: string,
  options: GetAllMarketListingsActionOptions = {},
): Promise<DCGetMyListingsResponse | null> {
  if (!token) {
    return null;
  }

  try {
    return await getAllMarketListingsData({ token }, options);
  } catch (error) {
    console.error("getAllMarketListingsAction failed", { options, error });
    return null;
  }
}

export async function getMarketplaceListingsAction(
  token: string,
  params: Omit<DCGetMarketplaceListingsParams, "limit" | "offset"> & {
    limit?: number;
    offset?: number;
  } = {},
): Promise<DCGetMarketplaceListingsResponse | null> {
  if (!token) {
    return null;
  }

  const fullParams: DCGetMarketplaceListingsParams = {
    minPrice: params.minPrice ?? 0,
    maxPrice: params.maxPrice ?? 999_999,
    sortBy: params.sortBy ?? "date_desc",
    search: params.search,
    class: params.class,
    subcategory: params.subcategory,
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
  };

  try {
    return await getMarketplaceListingsData({ token }, fullParams);
  } catch (error) {
    console.error("getMarketplaceListingsAction failed", { params, error });
    return null;
  }
}

export async function purchaseItemAction(
  token: string,
  listingId: string,
  quantity: number,
): Promise<DCPurchaseItemResponse | null> {
  if (!token) return null;
  try {
    return await purchaseItemData({ token }, { listingId, quantity });
  } catch (error) {
    console.error("purchaseItemAction failed", { listingId, quantity, error });
    return null;
  }
}

export async function sellItemAction(
  token: string,
  params: DCSellItemParams,
): Promise<DCSellItemResponse | null> {
  if (!token) return null;
  try {
    return await sellItemData({ token }, params);
  } catch (error) {
    console.error("sellItemAction failed", { params, error });
    return null;
  }
}
