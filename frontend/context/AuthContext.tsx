"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

type Role = "CUSTOMER" | "SELLER" | "ADMIN";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  referralCode: string;
  referredById?: number | null;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    referralCode?: string;
  }) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "stylino_token";

async function fetchMe(token: string): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me", undefined, token);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setToken(saved);
      fetchMe(saved)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(STORAGE_KEY, res.access_token);
    setToken(res.access_token);
    const me = await fetchMe(res.access_token);
    setUser(me);
    return me;
  };

  const register = async (input: { name: string; email: string; phone?: string; password: string; referralCode?: string }) => {
    await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        phone: input.phone,
        password: input.password,
        referral_code: input.referralCode,
      }),
    });
    return login(input.email, input.password);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
