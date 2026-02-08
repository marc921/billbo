import type { RouteProps } from "react-router-dom";
import { APIKeysPage } from "@/components/APIKeysPage/APIKeysPage";
import { EventsPage } from "@/components/EventsPage/EventsPage";
import { HomePage } from "@/components/HomePage/HomePage";
import { LoginPage } from "@/components/LoginPage/LoginPage";
import { SignupPage } from "@/components/SignupPage/SignupPage";
import { SKUsPage } from "@/components/SKUsPage/SKUsPage";

export type AppRoute = RouteProps & { public?: boolean };
type RouteDict = Record<string, AppRoute>;

export const appRoutes = {
  home: {
    path: "/",
    element: <HomePage />,
  },
  events: {
    path: "/events",
    element: <EventsPage />,
  },
  apiKeys: {
    path: "/api-keys",
    element: <APIKeysPage />,
  },
  skus: {
    path: "/skus",
    element: <SKUsPage />,
  },
  login: {
    path: "/login",
    element: <LoginPage />,
    public: true,
  },
  signup: {
    path: "/signup",
    element: <SignupPage />,
    public: true,
  },
} as const satisfies RouteDict;
