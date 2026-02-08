import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "@/api/auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  merchantID: string | null;
  login: (merchantID: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [merchantID, setMerchantID] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .me()
      .then((res) => setMerchantID(res.merchant_id))
      .catch(() => setMerchantID(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((id: string) => {
    setMerchantID(id);
  }, []);

  const logout = useCallback(() => {
    authApi.logout().finally(() => setMerchantID(null));
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: merchantID !== null,
      isLoading,
      merchantID,
      login,
      logout,
    }),
    [merchantID, isLoading, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
