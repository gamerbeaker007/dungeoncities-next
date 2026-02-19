import { API_ENDPOINTS } from "@/lib/statics";
import { DCDexResponse, DCMonsterDetailResponse } from "@/types/dc/monster-dex";
import {
  DCGameStateResponse,
  DCGetMyListingsParams,
  DCGetMyListingsResponse,
} from "@/types/dc/state";

type DCApiPayload =
  | {
      action: "GET_GAME_DATA";
      params: {
        dataType: "monsterDex";
        subAction: "GET_DEX_DATA" | "GET_MONSTER_DETAILS";
        monsterId?: number;
      };
    }
  | {
      action: "GET_STATE";
      params: Record<string, never>;
    }
  | {
      action: "GET_MY_LISTINGS";
      params: DCGetMyListingsParams;
    };

export type DCApiRequestOptions = {
  token: string;
};

export async function postDcApiAction<T>(
  options: DCApiRequestOptions,
  payload: DCApiPayload,
): Promise<T> {
  const apiUrl = API_ENDPOINTS.GAME_ACTION;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.8",
      authorization: `Bearer ${options.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `DC API request failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return response.json() as Promise<T>;
}

export function getMonsterDexData(options: DCApiRequestOptions) {
  return postDcApiAction<DCDexResponse>(options, {
    action: "GET_GAME_DATA",
    params: {
      dataType: "monsterDex",
      subAction: "GET_DEX_DATA",
    },
  });
}

export function getMonsterDetailsData(
  options: DCApiRequestOptions,
  monsterId: number,
) {
  return postDcApiAction<DCMonsterDetailResponse>(options, {
    action: "GET_GAME_DATA",
    params: {
      dataType: "monsterDex",
      subAction: "GET_MONSTER_DETAILS",
      monsterId,
    },
  });
}

export function getStateData(options: DCApiRequestOptions) {
  return postDcApiAction<DCGameStateResponse>(options, {
    action: "GET_STATE",
    params: {},
  });
}

export function getMarketInfoData(
  options: DCApiRequestOptions,
  params: DCGetMyListingsParams,
) {
  return postDcApiAction<DCGetMyListingsResponse>(options, {
    action: "GET_MY_LISTINGS",
    params,
  });
}

type GetAllMarketListingsOptions = {
  status?: DCGetMyListingsParams["status"];
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: DCGetMyListingsParams["sortBy"];
};

export async function getAllMarketListingsData(
  options: DCApiRequestOptions,
  requestOptions: GetAllMarketListingsOptions = {},
): Promise<DCGetMyListingsResponse> {
  const limit = requestOptions.limit ?? 50;
  const minPrice = requestOptions.minPrice ?? 0;
  const maxPrice = requestOptions.maxPrice ?? 999_999;
  const sortBy = requestOptions.sortBy ?? "date_desc";

  let offset = 0;
  let total = 0;
  let hasMore = true;
  let slotUsage: DCGetMyListingsResponse["slotUsage"] = {
    used: 0,
    max: 0,
    available: 0,
    percentUsed: 0,
    status: "ok",
  };
  const listings: DCGetMyListingsResponse["listings"] = [];

  while (hasMore) {
    const response = await getMarketInfoData(options, {
      status: requestOptions.status,
      limit,
      offset,
      minPrice,
      maxPrice,
      sortBy,
    });

    if (!response.success) {
      throw new Error("Failed to load market listings");
    }

    listings.push(...response.listings);
    total = response.total;
    slotUsage = response.slotUsage;
    hasMore = response.hasMore && response.listings.length > 0;
    offset += limit;
  }

  return {
    success: true,
    listings,
    total,
    limit,
    offset: 0,
    hasMore: false,
    slotUsage,
  };
}
