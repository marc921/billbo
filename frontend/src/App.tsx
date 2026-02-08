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
      <Route
        path={appRoutes.login.path}
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            appRoutes.login.element
          )
        }
      />
      <Route
        path={appRoutes.signup.path}
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            appRoutes.signup.element
          )
        }
      />
      <Route
        path={appRoutes.home.path}
        element={<RequireAuth>{appRoutes.home.element}</RequireAuth>}
      />
      <Route
        path={appRoutes.apiKeys.path}
        element={<RequireAuth>{appRoutes.apiKeys.element}</RequireAuth>}
      />
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
