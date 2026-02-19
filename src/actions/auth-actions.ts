"use server";

import { API_ENDPOINTS } from "@/lib/statics";

export type AuthChallengeResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export type AuthTokenResponse = {
  success: boolean;
  token?: string;
  error?: string;
};

function extractApiErrorMessage(errorText: string): string {
  if (!errorText) {
    return "Unknown authentication error";
  }

  try {
    const parsed = JSON.parse(errorText) as {
      message?: string;
      error?: string;
    };
    return parsed.message || parsed.error || errorText;
  } catch {
    return errorText;
  }
}

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
    const errorMessage = extractApiErrorMessage(errorText);
    console.error(
      "[Server Action] Challenge failed:",
      response.status,
      errorMessage,
    );
    return {
      success: false,
      error: errorMessage,
    };
  }

  const data = (await response.json()) as { message?: string };

  if (!data.message) {
    console.error("[Server Action] Challenge response missing message", data);
    return {
      success: false,
      error: "Challenge response missing message",
    };
  }

  return {
    success: true,
    message: data.message,
  };
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
    const errorMessage = extractApiErrorMessage(errorText);
    console.error(
      "[Server Action] Authentication failed:",
      response.status,
      errorMessage,
    );
    return {
      success: false,
      error: errorMessage,
    };
  }

  const data = (await response.json()) as { token?: string };

  if (!data.token) {
    console.error(
      "[Server Action] Authentication response missing token",
      data,
    );
    return {
      success: false,
      error: "Authentication response missing token",
    };
  }

  return {
    success: true,
    token: data.token,
  };
}
