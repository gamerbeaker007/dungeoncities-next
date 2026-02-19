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

type DCGetMyListingsRawResponse = Partial<DCGetMyListingsResponse> & {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function postDcApiAction<T>(
  options: DCApiRequestOptions,
  payload: DCApiPayload,
): Promise<T> {
  const apiUrl = API_ENDPOINTS.GAME_ACTION;
  const response = await fetch(apiUrl, {
    method: "POST",
    cache: "no-store",
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

function normalizeMarketListingsResponse(
  rawResponse: DCGetMyListingsRawResponse,
  params: DCGetMyListingsParams,
): DCGetMyListingsResponse {
  return {
    success: rawResponse.success ?? false,
    listings: Array.isArray(rawResponse.listings) ? rawResponse.listings : [],
    total: typeof rawResponse.total === "number" ? rawResponse.total : 0,
    limit:
      typeof rawResponse.limit === "number" ? rawResponse.limit : params.limit,
    offset:
      typeof rawResponse.offset === "number"
        ? rawResponse.offset
        : params.offset,
    hasMore: Boolean(rawResponse.hasMore),
    slotUsage: rawResponse.slotUsage ?? {
      used: 0,
      max: 0,
      available: 0,
      percentUsed: 0,
      status: "unknown",
    },
  };
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
  return postDcApiAction<DCGetMyListingsRawResponse>(options, {
    action: "GET_MY_LISTINGS",
    params,
  }).then((rawResponse) => {
    const normalizedResponse = normalizeMarketListingsResponse(
      rawResponse,
      params,
    );

    return normalizedResponse;
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

  const fetchPage = async (offsetValue: number) => {
    const baseParams: DCGetMyListingsParams = {
      status: requestOptions.status,
      limit,
      offset: offsetValue,
      minPrice,
      maxPrice,
      sortBy,
    };

    let response = await getMarketInfoData(options, baseParams);

    if (response.success) {
      return response;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });

    response = await getMarketInfoData(options, baseParams);

    return response;
  };

  while (hasMore) {
    const response = await fetchPage(offset);

    if (!response.success) {
      if (offset === 0) {
        return {
          success: true,
          listings: [],
          total: 0,
          limit,
          offset: 0,
          hasMore: false,
          slotUsage,
        };
      }

      break;
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
