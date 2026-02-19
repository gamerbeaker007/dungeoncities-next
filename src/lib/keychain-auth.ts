import {
  requestAuthChallenge,
  submitAuthSignature,
} from "@/actions/auth-actions";
import { KeychainKeyTypes, KeychainSDK } from "keychain-sdk";

// Extend Window interface for TypeScript
declare global {
  interface Window {
    hive_keychain?: unknown;
  }
}

// keychain-sdk's TypeScript types don't expose decode() — cast to access it
type KeychainDecodeResult = {
  success: boolean;
  result?: string | { result?: string };
  error?: string;
  message?: string;
};

type KeychainSDKWithDecode = InstanceType<typeof KeychainSDK> & {
  decode: (params: {
    username: string;
    message: string;
    method: KeychainKeyTypes;
  }) => Promise<KeychainDecodeResult>;
};

export type KeychainLoginResult = {
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
};

/**
 * Initiates the Hive Keychain login flow
 * Uses requestVerifyKey (via KeychainSDK.decode()) to verify user authority
 * @param username - The Hive username to authenticate
 * @returns Promise with login result including token if successful
 */
export async function loginWithKeychain(
  username: string,
): Promise<KeychainLoginResult> {
  try {
    const keychainAvailable = await waitForKeychainAvailability();
    if (!keychainAvailable) {
      return {
        success: false,
        error:
          "Hive Keychain extension not detected. Please unlock/enable it and try again.",
      };
    }

    // Initialize Keychain SDK
    const keychain = new KeychainSDK(window) as KeychainSDKWithDecode;

    // Step 1: Request challenge message from server
    const challengeResponse = await requestAuthChallenge(username);
    if (!challengeResponse.success || !challengeResponse.message) {
      const challengeError =
        challengeResponse.error || "Failed to request authentication challenge";
      console.error("[Keychain Login] Challenge request failed:", {
        username,
        error: challengeError,
      });
      return {
        success: false,
        error: challengeError,
      };
    }

    const challengeMessage = challengeResponse.message;

    // Step 2: Request signature from Keychain using requestVerifyKey (via decode)
    // KeychainSDK.decode() internally calls window.hive_keychain.requestVerifyKey()
    // which verifies the user has authority over the account by signing the challenge
    const signResult = await keychain.decode({
      username,
      message: challengeMessage,
      method: KeychainKeyTypes.posting,
    });

    if (!signResult.success) {
      const errorMsg =
        signResult.error ?? signResult.message ?? "Signature failed";
      console.error("[Keychain Login] Signature failed", {
        username,
        error: errorMsg,
        response: signResult,
      });
      return { success: false, error: errorMsg };
    }

    // Handle both string and nested-object result formats from keychain-sdk
    const signature =
      typeof signResult.result === "string"
        ? signResult.result
        : ((signResult.result as { result?: string } | undefined)?.result ??
          "");

    if (!signature) {
      console.error("[Keychain Login] Empty signature received", {
        username,
        response: signResult,
      });
      return { success: false, error: "Keychain returned an empty signature" };
    }

    // Step 3: Submit signature to get token
    const tokenResponse = await submitAuthSignature(username, signature);
    if (!tokenResponse.success || !tokenResponse.token) {
      const tokenError = tokenResponse.error || "Authentication failed";
      console.error("[Keychain Login] Token request failed:", {
        username,
        error: tokenError,
      });
      return {
        success: false,
        error: tokenError,
      };
    }

    return {
      success: true,
      token: tokenResponse.token,
      username,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[Keychain Login] Unexpected error during authentication", {
      username,
      error,
    });
    return { success: false, error: message };
  }
}

/**
 * Check if Hive Keychain extension is installed
 * @returns True if Keychain is available
 */
export function isKeychainAvailable(): boolean {
  if (typeof window === "undefined") return false;
  // Check if the Hive Keychain extension has injected itself into the window
  return !!window.hive_keychain;
}

export async function waitForKeychainAvailability(
  timeoutMs = 2500,
  pollIntervalMs = 150,
): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  if (isKeychainAvailable()) {
    return true;
  }

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    if (isKeychainAvailable()) {
      return true;
    }
  }

  return false;
}
