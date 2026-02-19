"use server";

import { API_ENDPOINTS } from "@/lib/statics";

export type AuthChallengeResponse = {
  message: string;
};

export type AuthTokenResponse = {
  token: string;
};

/**
 * Server action: Request authentication challenge from DC API
 */
export async function requestAuthChallenge(
  account: string,
): Promise<AuthChallengeResponse> {
  const response = await fetch(API_ENDPOINTS.AUTHENTICATE, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ account }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "[Server Action] Challenge failed:",
      response.status,
      errorText,
    );
    throw new Error(`Challenge request failed: ${response.status}`);
  }

  const data = await response.json();
  return data as AuthChallengeResponse;
}

/**
 * Server action: Submit signed challenge to get authentication token
 */
export async function submitAuthSignature(
  account: string,
  result: string,
): Promise<AuthTokenResponse> {
  const response = await fetch(API_ENDPOINTS.AUTHENTICATE, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ account, result }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "[Server Action] Authentication failed:",
      response.status,
      errorText,
    );
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();
  return data as AuthTokenResponse;
}
