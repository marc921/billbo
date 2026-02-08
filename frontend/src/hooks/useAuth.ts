import { createContext, useContext } from "react";

export type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  merchantID: string | null;
  merchantName: string | null;
  login: (merchantID: string, merchantName: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
