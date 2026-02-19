import { API_ENDPOINTS } from "@/lib/statics";
import { DCDexResponse, DCMonsterDetailResponse } from "@/types/dc/monster-dex";
import { DCGameStateResponse } from "@/types/dc/state";

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
