"use server";

import {
  getAllMarketListingsData,
  getMarketInfoData,
  getStateData,
  updateLocationData,
} from "@/lib/dc-api";
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
