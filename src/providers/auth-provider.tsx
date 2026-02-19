"use client";

import { validateGameTokenAction } from "@/actions/game-actions";
import {
  isKeychainAvailable,
  KeychainLoginResult,
  loginWithKeychain,
} from "@/lib/keychain-auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

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
      // Check if Keychain is available
      const keychainAvailable = isKeychainAvailable();
      setIsKeychainInstalled(keychainAvailable);

      // Load saved auth from localStorage
      const savedToken = localStorage.getItem("dc_token");
      const savedUsername = localStorage.getItem("dc_username");

      if (savedToken && savedUsername) {
        const isValid = await validateGameTokenAction(savedToken);

        if (isValid) {
          setToken(savedToken);
          setUsername(savedUsername);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("dc_token");
          localStorage.removeItem("dc_username");
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
