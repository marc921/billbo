import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { appRoutes } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Number.POSITIVE_INFINITY,
      retry: 0,
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Routes>
          {Object.entries(appRoutes).map(([key, props]) => (
            <Route key={key} {...props} />
          ))}
        </Routes>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
