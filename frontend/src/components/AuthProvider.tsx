import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "@/api/auth";
import { AuthContext } from "@/hooks/useAuth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [merchantID, setMerchantID] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .me()
      .then((res) => {
        setMerchantID(res.merchant_id);
        setMerchantName(res.name);
      })
      .catch(() => {
        setMerchantID(null);
        setMerchantName(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((id: string, name: string) => {
    setMerchantID(id);
    setMerchantName(name);
  }, []);

  const logout = useCallback(() => {
    authApi.logout().finally(() => {
      setMerchantID(null);
      setMerchantName(null);
    });
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: merchantID !== null,
      isLoading,
      merchantID,
      merchantName,
      login,
      logout,
    }),
    [merchantID, merchantName, isLoading, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
