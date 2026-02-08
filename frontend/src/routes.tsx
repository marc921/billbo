import type { RouteProps } from "react-router-dom";
import { HomePage } from "@/components/HomePage/HomePage";
import { LoginPage } from "@/components/LoginPage/LoginPage";
import { SignupPage } from "@/components/SignupPage/SignupPage";

type RouteDict = Record<string, RouteProps>;

export const appRoutes = {
  home: {
    path: "/",
    element: <HomePage />,
  },
  login: {
    path: "/login",
    element: <LoginPage />,
  },
  signup: {
    path: "/signup",
    element: <SignupPage />,
  },
} as const satisfies RouteDict;
