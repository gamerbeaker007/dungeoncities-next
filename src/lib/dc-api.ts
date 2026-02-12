export type DcApiPayload = {
  action: "GET_GAME_DATA";
  params: {
    dataType: "monsterDex";
    subAction: "GET_DEX_DATA" | "GET_MONSTER_DETAILS";
    monsterId?: number;
  };
};

type DcApiClientOptions = {
  token: string;
  apiUrl?: string;
};

export function createDcApiClient(options: DcApiClientOptions) {
  const apiUrl =
    options.apiUrl ?? "https://api.dungeoncities.com/api/game/action";

  const headers = {
    accept: "*/*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-US,en;q=0.8",
    authorization: `Bearer ${options.token}`,
    "content-type": "application/json",
  };

  return {
    async postAction<T = unknown>(payload: DcApiPayload): Promise<T> {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Request failed: ${response.status} ${response.statusText}`,
        );
      }

      return response.json() as Promise<T>;
    },
  };
}

export function getDexDataPayload(): DcApiPayload {
  return {
    action: "GET_GAME_DATA",
    params: {
      dataType: "monsterDex",
      subAction: "GET_DEX_DATA",
    },
  };
}

export function getMonsterDetailsPayload(monsterId: number): DcApiPayload {
  return {
    action: "GET_GAME_DATA",
    params: {
      dataType: "monsterDex",
      subAction: "GET_MONSTER_DETAILS",
      monsterId,
    },
  };
}
