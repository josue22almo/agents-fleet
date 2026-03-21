"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { setTokens, clearTokens, getAccessToken } from "@/lib/auth";
import type { ProfileResponse, AuthTokensResponse } from "@repo/contracts/iam";

interface AuthContextType {
  user: ProfileResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await api.get<ProfileResponse>("/auth/me");
      setUser(profile);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getAccessToken()) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await api.post<AuthTokensResponse>("/auth/login", {
        email,
        password,
      });
      setTokens(tokens.accessToken, tokens.refreshToken);
      await fetchProfile();
      router.push("/dashboard");
    },
    [fetchProfile, router],
  );

  const signup = useCallback(
    async (email: string, password: string, fullName?: string) => {
      await api.post("/auth/signup", { email, password, fullName });
      const tokens = await api.post<AuthTokensResponse>("/auth/login", {
        email,
        password,
      });
      setTokens(tokens.accessToken, tokens.refreshToken);
      await fetchProfile();
      router.push("/dashboard");
    },
    [fetchProfile, router],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
