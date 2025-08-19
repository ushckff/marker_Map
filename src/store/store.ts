import { configureStore } from "@reduxjs/toolkit";
import user from "./userSlice";

export const store = configureStore({
  reducer: { user },
  devTools: import.meta.env.MODE !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
