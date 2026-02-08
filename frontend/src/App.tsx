import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { appRoutes } from "@/routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Number.POSITIVE_INFINITY,
      retry: 0,
    },
  },
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Header />
      {children}
    </>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Routes>
      {Object.entries(appRoutes).map(([key, route]) => (
        <Route
          key={key}
          path={route.path}
          element={
            "public" in route && route.public ? (
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                route.element
              )
            ) : (
              <RequireAuth>{route.element}</RequireAuth>
            )
          }
        />
      ))}
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <AppRoutes />
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
