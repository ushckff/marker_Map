import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store } from "./store/store";
import { router } from "./app/router";
import "./styles/global.css";
import "./app/root.css";
import AuthWatcher from "./pages/auth/AuthWatcher";

export function RedirectHandler() {
  useEffect(() => {
    const saved = sessionStorage.getItem("redirect");
    if (!saved) return;

    sessionStorage.removeItem("redirect");

    const base = import.meta.env.BASE_URL || "/";
    const baseNoTrail = base.endsWith("/") ? base.slice(0, -1) : base;
    let path = saved;

    if (baseNoTrail !== "/" && path.startsWith(baseNoTrail)) {
      path = path.slice(baseNoTrail.length);
    }

    if (!path.startsWith("/")) path = `/${path}`;
    router.navigate(path, { replace: true });
  }, []);

  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthWatcher />
      <RedirectHandler />
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
