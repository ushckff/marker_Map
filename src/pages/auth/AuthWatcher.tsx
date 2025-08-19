import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { observeAuth, type AppUser } from "@/services/auth";
import { setUser, clearUser } from "@/store/userSlice";
import { auth } from "@/lib/firebase";

export default function AuthWatcher() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsub = observeAuth(async (u: AppUser | null) => {
      if (!u) {
        dispatch(clearUser());
        return;
      }

      if (!u.displayName && auth.currentUser) {
        try {
          await auth.currentUser.reload();
        } catch {
          /* ignore */
        }
        const cu = auth.currentUser;
        dispatch(
          setUser({
            uid: cu?.uid ?? u.uid,
            displayName: cu?.displayName ?? null,
            email: cu?.email ?? u.email ?? null,
            photoURL: cu?.photoURL ?? null,
          })
        );
        return;
      }

      dispatch(setUser(u));
    });

    return unsub;
  }, [dispatch]);

  return null;
}
