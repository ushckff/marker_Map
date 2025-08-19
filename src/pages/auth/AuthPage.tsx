import "./AuthPage.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { observeAuth, type AppUser } from "@/services/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/userSlice";

type Mode = "signin" | "signup";

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const redirectTo = useMemo(() => {
    const s = new URLSearchParams(location.search);
    return s.get("next") ?? "/";
  }, [location.search]);

  useEffect(() => {
    const unsub = observeAuth((u: AppUser | null) => {
      if (u) navigate(redirectTo, { replace: true });
    });
    return unsub;
  }, [navigate, redirectTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const em = email.trim();
    if (!isValidEmail(em)) {
      setError("Введите корректный e-mail.");
      return;
    }

    if (mode === "signin") {
      if (pass1.length < 6) {
        setError("Пароль должен быть не короче 6 символов.");
        return;
      }
      setBusy(true);
      try {
        const res = await signInWithEmailAndPassword(auth, em, pass1);
        await res.user.reload();
        dispatch(
          setUser({
            uid: res.user.uid,
            email: res.user.email ?? null,
            displayName: res.user.displayName ?? null,
            photoURL: res.user.photoURL ?? null,
          })
        );
        navigate(redirectTo, { replace: true });
      } catch (err: unknown) {
        setError(parseAuthError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (name.trim().length < 2) {
      setError("Введите имя (минимум 2 символа).");
      return;
    }
    if (pass1.length < 6) {
      setError("Пароль должен быть не короче 6 символов.");
      return;
    }
    if (pass1 !== pass2) {
      setError("Пароли не совпадают.");
      return;
    }
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, em, pass1);
      const trimmed = name.trim();

      await updateProfile(cred.user, { displayName: trimmed });

      await cred.user.reload();

      dispatch(
        setUser({
          uid: cred.user.uid,
          email: cred.user.email ?? null,
          displayName: cred.user.displayName ?? trimmed,
          photoURL: cred.user.photoURL ?? null,
        })
      );

      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      setError(parseAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await res.user.reload();
      dispatch(
        setUser({
          uid: res.user.uid,
          email: res.user.email ?? null,
          displayName: res.user.displayName ?? null,
          photoURL: res.user.photoURL ?? null,
        })
      );
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      setError(parseAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Режим входа">
          <button
            role="tab"
            aria-selected={mode === "signin"}
            className={`auth-tab ${mode === "signin" ? "is-active" : ""}`}
            onClick={() => setMode("signin")}
          >
            Войти
          </button>
          <button
            role="tab"
            aria-selected={mode === "signup"}
            className={`auth-tab ${mode === "signup" ? "is-active" : ""}`}
            onClick={() => setMode("signup")}
          >
            Зарегистрироваться
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === "signup" && (
            <>
              <label className="auth-label" htmlFor="name">
                Имя
              </label>
              <input
                id="name"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите ваше имя"
                autoComplete="name"
              />
            </>
          )}

          <label className="auth-label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            className="auth-input"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete={mode === "signin" ? "username" : "email"}
          />

          <label className="auth-label" htmlFor="pass1">
            Пароль {mode === "signup" ? "(мин. 6 символов)" : ""}
          </label>
          <input
            id="pass1"
            className="auth-input"
            type="password"
            value={pass1}
            onChange={(e) => setPass1(e.target.value)}
            placeholder="••••••••"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
          />

          {mode === "signup" && (
            <>
              <label className="auth-label" htmlFor="pass2">
                Повторите пароль
              </label>
              <input
                id="pass2"
                className="auth-input"
                type="password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy
              ? "Подождите…"
              : mode === "signin"
              ? "Войти"
              : "Создать аккаунт"}
          </button>

          <div className="auth-sep" role="separator" aria-label="или" />
          <button
            className="btn btn-google"
            type="button"
            onClick={handleGoogle}
            disabled={busy}
          >
            Продолжить через Google
          </button>
        </form>
      </div>
    </div>
  );
}

function parseAuthError(err: unknown): string {
  const msg =
    (err as { message?: string; code?: string })?.code ??
    (err as { message?: string })?.message ??
    "";
  if (msg.includes("auth/email-already-in-use"))
    return "Этот e-mail уже используется.";
  if (msg.includes("auth/invalid-email")) return "Некорректный e-mail.";
  if (msg.includes("auth/weak-password"))
    return "Слишком простой пароль (минимум 6 символов).";
  if (
    msg.includes("auth/user-not-found") ||
    msg.includes("auth/wrong-password")
  )
    return "Неверный e-mail или пароль.";
  if (msg.includes("auth/popup-closed-by-user"))
    return "Окно входа было закрыто.";
  return "Ошибка. Попробуйте ещё раз.";
}
