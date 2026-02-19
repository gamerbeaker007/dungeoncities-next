"use server";

import {
  getAllMarketListingsData,
  getMarketInfoData,
  getStateData,
} from "@/lib/dc-api";
import {
  DCGameStateResponse,
  DCGetMyListingsParams,
  DCGetMyListingsResponse,
} from "@/types/dc/state";

export async function getGameStateAction(
  token: string,
): Promise<DCGameStateResponse | null> {
  if (!token) {
    return null;
  }

  try {
    return await getStateData({ token });
  } catch {
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

export async function getMarketInfoAction(
  token: string,
  params: DCGetMyListingsParams,
): Promise<DCGetMyListingsResponse | null> {
  if (!token) {
    return null;
  }

  try {
    return await getMarketInfoData({ token }, params);
  } catch {
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
  } catch {
    return null;
  }
}
