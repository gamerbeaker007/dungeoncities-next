"use server";

import { getStateData } from "@/lib/dc-api";
import { DCGameStateResponse } from "@/types/dc/state";

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
