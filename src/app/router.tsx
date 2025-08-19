import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";
import RootLayout from "@/app/root-layout";

import HomePage from "@/pages/home/HomePage";
import CreatePage from "@/pages/create/CreatePage";
import RouteDetailsPage from "@/pages/route-details/RouteDetailsPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import AuthPage from "@/pages/auth/AuthPage";

import ProtectedRoute from "@/components/ProtectedRoute";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "auth", element: <AuthPage /> },
      {
        path: "create",
        element: (
          <ProtectedRoute>
            <CreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      { path: "route/:id", element: <RouteDetailsPage /> },

      { path: "route", element: <Navigate to="/" replace /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});
