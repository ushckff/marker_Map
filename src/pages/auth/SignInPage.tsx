import "./SignInPage.css";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useLocation, useNavigate } from "react-router-dom";

type FromState = { from?: string };

function isFromState(value: unknown): value is FromState {
  if (!value || typeof value !== "object") return false;
  return (
    !("from" in value) ||
    typeof (value as Record<string, unknown>).from === "string"
  );
}

export default function SignInPage() {
  const user = useSelector((s: RootState) => s.user.current);
  const location = useLocation();
  const navigate = useNavigate();

  const from = (isFromState(location.state) && location.state?.from) || "/";

  async function handleSignIn() {
    await signInWithPopup(auth, googleProvider);
    navigate(from, { replace: true });
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  return (
    <div className="signin-wrap">
      <h1 className="signin-title">{user ? "Аккаунт" : "Вход"}</h1>

      {user ? (
        <div className="signin-card">
          <img
            className="signin-avatar"
            src={
              user.photoURL || "https://dummyimage.com/64x64/ddd/fff.png&text=U"
            }
            alt="avatar"
          />
          <div className="signin-info">
            <div className="signin-name">{user.displayName || user.email}</div>
            <button className="btn btn-outline" onClick={handleSignOut}>
              Выйти
            </button>
          </div>
        </div>
      ) : (
        <div className="signin-card">
          <p className="signin-desc">
            Авторизуйтесь, чтобы создавать и сохранять маршруты.
          </p>
          <button className="btn btn-primary" onClick={handleSignIn}>
            Войти через Google
          </button>
        </div>
      )}
    </div>
  );
}
