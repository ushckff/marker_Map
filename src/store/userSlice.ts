import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserLite = {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
} | null;

type State = { current: UserLite; loading: boolean };

const initialState: State = { current: null, loading: true };

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserLite>) {
      state.current = action.payload;
      state.loading = false;
    },
    clearUser(state) {
      state.current = null;
      state.loading = false;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;

export const selectUser = (s: { user: State }) => s.user.current;
export const selectUserLoading = (s: { user: State }) => s.user.loading;
export const selectIsAuthed = (s: { user: State }) => Boolean(s.user.current);
