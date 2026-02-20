"use client";

import {
  isKeychainAvailable,
  KeychainLoginResult,
  loginWithKeychain,
  waitForKeychainAvailability,
} from "@/lib/keychain-auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

function isJwtExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    if (typeof decoded.exp !== "number") return false; // no exp claim — assume valid
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return false; // can't decode — assume valid, let API calls fail naturally
  }
}

type AuthContextType = {
  isAuthenticated: boolean;
  username: string | null;
  token: string | null;
  isKeychainInstalled: boolean;
  isLoading: boolean;
  login: (username: string) => Promise<KeychainLoginResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isKeychainInstalled, setIsKeychainInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Wait for Keychain — Chrome injects extensions later than Brave/Firefox,
      // so a synchronous check here will fail in Chrome even when the extension is installed.
      const keychainAvailable = await waitForKeychainAvailability();
      setIsKeychainInstalled(keychainAvailable);

      // Load saved auth from localStorage
      const savedToken = localStorage.getItem("dc_token");
      const savedUsername = localStorage.getItem("dc_username");

      if (savedToken && savedUsername) {
        if (isJwtExpired(savedToken)) {
          // Token has expired per its own exp claim — clear stored auth
          localStorage.removeItem("dc_token");
          localStorage.removeItem("dc_username");
        } else {
          // Token is still valid — restore session without a server round-trip.
          // The DC API will reject the token on actual API calls if it has been revoked.
          setToken(savedToken);
          setUsername(savedUsername);
          setIsAuthenticated(true);
        }
      }

      setIsLoading(false);
    };

    void initAuth();
  }, []);

  const login = async (username: string): Promise<KeychainLoginResult> => {
    setIsLoading(true);
    setIsKeychainInstalled(isKeychainAvailable());
    const result = await loginWithKeychain(username);

    setIsKeychainInstalled(isKeychainAvailable());

    if (result.success && result.token && result.username) {
      setToken(result.token);
      setUsername(result.username);
      setIsAuthenticated(true);

      // Save to localStorage
      localStorage.setItem("dc_token", result.token);
      localStorage.setItem("dc_username", result.username);
    } else {
      console.error("[Auth Provider] Login failed:", result.error);
    }

    setIsLoading(false);
    return result;
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setIsAuthenticated(false);
    localStorage.removeItem("dc_token");
    localStorage.removeItem("dc_username");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        token,
        isKeychainInstalled,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
