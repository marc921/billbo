import type { RouteProps } from "react-router-dom";
import { HomePage } from "@/components/HomePage/HomePage";

type RouteDict = Record<string, RouteProps>;

export const appRoutes = {
  home: {
    path: "/",
    element: <HomePage />,
  },
} as const satisfies RouteDict;
