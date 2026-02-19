import {
  requestAuthChallenge,
  submitAuthSignature,
} from "@/actions/auth-actions";
import { KeychainKeyTypes } from "hive-keychain-commons";
import * as KeychainSDKModule from "keychain-sdk";

type KeychainSDKType = typeof KeychainSDKModule & {
  KeychainSDK: new (window: Window) => {
    decode: (params: {
      username: string;
      message: string;
      method: KeychainKeyTypes;
    }) => Promise<{
      success: boolean;
      result?: string | { result?: string };
      error?: string;
      message?: string;
    }>;
  };
};

const KeychainSDK = (KeychainSDKModule as KeychainSDKType).KeychainSDK;

// Extend Window interface for TypeScript
declare global {
  interface Window {
    hive_keychain?: unknown;
  }
}

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
    // Initialize Keychain SDK
    const keychain = new KeychainSDK(window);

    // Step 1: Request challenge message from server
    const challengeResponse = await requestAuthChallenge(username);
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
        signResult.error || signResult.message || "Signature failed";
      console.error("[Keychain Login] Signature failed:", errorMsg);
      console.error("[Keychain Login] Full response:", signResult);
      return {
        success: false,
        error: errorMsg,
      };
    }

    // The result from decode/requestVerifyKey should have the # prefix
    // Handle different response formats from keychain-sdk
    let signature: string;
    if (typeof signResult.result === "string") {
      signature = signResult.result;
    } else if (
      signResult.result &&
      typeof signResult.result === "object" &&
      "result" in signResult.result
    ) {
      signature = (signResult.result as { result?: string }).result || "";
    } else {
      console.error("[Keychain Login] Unexpected result format:", signResult);
      return {
        success: false,
        error: "Unexpected signature format received from Keychain",
      };
    }

    // Step 3: Submit signature to get token
    const tokenResponse = await submitAuthSignature(username, signature);
    return {
      success: true,
      token: tokenResponse.token,
      username,
    };
  } catch (error) {
    console.error("[Keychain Login] Error during authentication:", error);
    console.error("[Keychain Login] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
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
