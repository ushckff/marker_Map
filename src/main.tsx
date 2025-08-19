import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store } from "./store/store";
import { router } from "./app/router";
import "./styles/global.css";
import "./app/root.css";
import AuthWatcher from "./pages/auth/AuthWatcher";

const redirectPath = sessionStorage.getItem("redirect");
if (redirectPath) {
  sessionStorage.removeItem("redirect");
  router.navigate(redirectPath, { replace: true });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthWatcher />
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
