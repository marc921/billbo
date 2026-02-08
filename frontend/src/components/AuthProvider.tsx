import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "@/api/auth";
import { AuthContext } from "@/hooks/useAuth";

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
