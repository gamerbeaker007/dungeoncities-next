import { API_ENDPOINTS } from "@/lib/statics";
import { DCDexResponse, DCMonsterDetailResponse } from "@/types/dc/monster-dex";
import {
  DCGameLocation,
  DCGameStateResponse,
  DCGetMyListingsParams,
  DCGetMyListingsResponse,
  DCUpdateLocationResponse,
} from "@/types/dc/state";
import axios from "axios";
import * as rax from "retry-axios";

// ---------------------------------------------------------------------------
// Shared DC API axios instance
// Retry is handled at the HTTP transport level by retry-axios (5xx, 429, 408).
// Application-level errors (success=false in body) are NOT retried — they are
// business logic failures and should surface immediately.
// ---------------------------------------------------------------------------

const dcApiClient = axios.create({
  baseURL: API_ENDPOINTS.GAME_ACTION,
  timeout: 15_000,
  headers: {
    accept: "*/*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-US,en;q=0.8",
    "content-type": "application/json",
  },
});

rax.attach(dcApiClient);
dcApiClient.defaults.raxConfig = {
  retry: 3,
  retryDelay: 500,
  backoffType: "exponential",
  statusCodesToRetry: [
    [408, 408],
    [429, 429],
    [500, 599],
  ],
  onRetryAttempt: async (err) => {
    const cfg = rax.getConfig(err);
    console.warn("[DC API] HTTP retry attempt", {
      attempt: cfg?.currentRetryAttempt,
      status: err.response?.status,
      url: err.config?.url,
    });
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
    }
  | {
      action: "UPDATE_LOCATION";
      params: {
        targetLocation: DCGameLocation;
        timestamp: number;
      };
    };

export type DCApiRequestOptions = {
  token: string;
};

type DCApiRawResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

function extractErrorMessage(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }
  if (data && typeof data === "object") {
    const parsed = data as { error?: string; message?: string };
    return parsed.error ?? parsed.message ?? "Unknown DC API error";
  }
  return "Unknown DC API error";
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

export async function postDcApiAction<T>(
  options: DCApiRequestOptions,
  payload: DCApiPayload,
): Promise<T> {
  try {
    const response = await dcApiClient.post<T>("", payload, {
      headers: {
        authorization: `Bearer ${options.token}`,
      },
    });

    const responseData = response.data;

    if (!responseData || typeof responseData !== "object") {
      console.warn("[DC API] Response data missing or invalid", {
        action: payload.action,
        responseData,
      });
      throw new Error("DC API returned invalid payload");
    }

    // Application-level error: success=false is a business logic failure,
    // not a transport error — do NOT retry, surface it immediately.
    const rawResponse = responseData as DCApiRawResponse;
    if (rawResponse.success === false) {
      const apiErrorMessage =
        rawResponse.error ??
        rawResponse.message ??
        "DC API returned success=false";
      console.error("[DC API] API reported unsuccessful response", {
        action: payload.action,
        error: apiErrorMessage,
      });
      throw new Error(apiErrorMessage);
    }

    return responseData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = extractErrorMessage(error.response?.data);
      console.error("[DC API] HTTP request failed", {
        action: payload.action,
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorMessage,
      });
      throw new Error(
        `DC API request failed: ${error.response?.status ?? "N/A"} ${error.response?.statusText ?? ""} - ${errorMessage}`,
      );
    }

    if (error instanceof Error) {
      // Re-throw application errors (success=false path above) directly
      throw error;
    }

    console.error("[DC API] Unknown error", { action: payload.action, error });
    throw new Error("Unknown error during DC API request");
  }
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

export function updateLocationData(
  options: DCApiRequestOptions,
  targetLocation: DCGameLocation,
): Promise<DCUpdateLocationResponse> {
  return postDcApiAction<DCUpdateLocationResponse>(options, {
    action: "UPDATE_LOCATION",
    params: {
      targetLocation,
      timestamp: Date.now(),
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
    const baseParams: DCGetMyListingsParams = {
      status: requestOptions.status,
      limit,
      offset,
      minPrice,
      maxPrice,
      sortBy,
    };

    let response: DCGetMyListingsResponse;

    try {
      response = await getMarketInfoData(options, baseParams);
    } catch (error) {
      console.error("[DC API] Failed to fetch listings page", {
        baseParams,
        error: error instanceof Error ? error.message : String(error),
      });

      if (offset === 0) {
        return {
          success: false,
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
    success: listings.length > 0,
    listings,
    total,
    limit,
    offset: 0,
    hasMore: false,
    slotUsage,
  };
}
