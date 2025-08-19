import "./ProfilePage.css";
import "@/pages/home/HomePage.css";

import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { setUser } from "@/store/userSlice";
import { useEffect, useState, useCallback } from "react";
import { signOutUser } from "@/services/auth";
import { updateMyProfile } from "@/services/userProfile";
import { useNavigate, Link } from "react-router-dom";
import placeholder from "/assets/profile.png";
import { listUserRoutes, deleteRoute } from "@/services/routes";
import type { RouteWithId } from "@/entities/route/types";
import trashIcon from "@/assets/trash.png";
import type { Timestamp } from "firebase/firestore";

function toDateSafe(
  v: Timestamp | Date | number | string | null | undefined
): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const maybeTs = v as { toDate?: () => Date };
  if (typeof maybeTs?.toDate === "function") {
    try {
      return maybeTs.toDate();
    } catch {
      return null;
    }
  }
  return null;
}
const fmtDate = (v: Timestamp | Date | number | string | null | undefined) => {
  const d = toDateSafe(v);
  return d ? d.toLocaleDateString() : "";
};

export default function ProfilePage() {
  const user = useSelector((s: RootState) => s.user.current);
  const loading = useSelector((s: RootState) => s.user.loading);
  const dispatch = useDispatch();
  const nav = useNavigate();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [myRoutes, setMyRoutes] = useState<RouteWithId[]>([]);
  const [mrLoading, setMrLoading] = useState(false);
  const [mrError, setMrError] = useState<string | null>(null);

  const loadMyRoutes = useCallback(async () => {
    if (!user?.uid) return;
    setMrLoading(true);
    setMrError(null);
    try {
      const res = await listUserRoutes(user.uid);
      setMyRoutes(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMrError(msg);
      setMyRoutes([]);
      console.error("[Profile] listUserRoutes failed:", e);
    } finally {
      setMrLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadMyRoutes();
  }, [loadMyRoutes]);

  if (loading)
    return (
      <div className="profile-wrap">
        <div className="spinner" />
      </div>
    );
  if (!user) return <div className="profile-wrap">Не авторизован</div>;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await updateMyProfile({
        displayName: name.trim() || undefined,
      });
      dispatch(
        setUser({
          uid: user.uid,
          email: user.email ?? null,
          displayName: res.displayName,
          photoURL: res.photoURL,
        })
      );
      setEditing(false);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        "Не удалось сохранить профиль.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    try {
      await signOutUser();
      nav("/", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function handleShare(routeId: string) {
    const url = `${location.origin}/route/${routeId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Ссылка скопирована");
    } catch {
      prompt("Скопируйте ссылку:", url);
    }
  }

  async function handleDelete(routeId: string) {
    if (!confirm("Удалить маршрут?")) return;
    await deleteRoute(routeId);
    await loadMyRoutes();
  }

  return (
    <div className="profile-wrap">
      {/* Шапка профиля */}
      <div className="profile-card">
        <div className="profile-head">
          <div className="avatar">
            <img
              src={user.photoURL ?? placeholder}
              alt="Аватар"
              className="avatar__img"
            />
          </div>

          <div className="head-info">
            <h1 className="title">{user.displayName ?? "Без имени"}</h1>
            <div className="muted">{user.email ?? "—"}</div>
          </div>

          <div className="head-actions">
            {!editing ? (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => setEditing(true)}
                >
                  Изменить профиль
                </button>
                <button className="btn" onClick={() => void handleSignOut()}>
                  Выйти
                </button>
              </>
            ) : null}
          </div>
        </div>

        {editing && (
          <form className="edit-form" onSubmit={handleSave}>
            <div className="form-row">
              <label className="label" htmlFor="displayName">
                Имя
              </label>
              <input
                id="displayName"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите имя"
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Сохранение…" : "Сохранить"}
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setEditing(false);
                  setName(user.displayName ?? "");
                  setError(null);
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>

      <section className="myroutes">
        <div className="myroutes__head">
          <h2 className="myroutes__title">Мои маршруты</h2>
        </div>

        {mrLoading && <p className="muted">Загрузка…</p>}
        {!mrLoading && mrError && <p className="err">Ошибка: {mrError}</p>}
        {!mrLoading && !mrError && myRoutes.length === 0 && (
          <div className="empty-box">
            <div className="empty-title">У вас ещё нет маршрутов</div>
            <div className="empty-sub">
              Создайте первый — нажмите «Создать маршрут» в шапке.
            </div>
          </div>
        )}

        {!mrLoading && !mrError && myRoutes.length > 0 && (
          <ul className="my-grid">
            {myRoutes.map((r) => (
              <li key={r.id} className="my-card">
                {r.coverPhotoUrl && (
                  <img
                    className="my-cover"
                    src={r.coverPhotoUrl}
                    alt={r.title}
                  />
                )}
                <div className="my-body">
                  <Link to={`/route/${r.id}`} className="my-title">
                    {r.title}
                  </Link>

                  <div className="my-list">
                    <div className="my-list__row">
                      <span className="my-list__label">Город</span>
                      <span className="my-list__value">{r.city || "—"}</span>
                    </div>
                    <div className="my-list__row">
                      <span className="my-list__label">Дней</span>
                      <span className="my-list__value">{r.days}</span>
                    </div>
                    <div className="my-list__row">
                      <span className="my-list__label">Создан</span>
                      <span className="my-list__value">
                        {fmtDate(r.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="my-actions">
                    <Link className="btn btn-solid" to={`/route/${r.id}`}>
                      Открыть
                    </Link>
                    <button
                      className="btn"
                      onClick={() => void handleShare(r.id)}
                    >
                      Поделиться
                    </button>
                    <button
                      className="icon-btn trash"
                      title="Удалить"
                      aria-label="Удалить"
                      onClick={() => void handleDelete(r.id)}
                    >
                      <img className="icon" src={trashIcon} alt="" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
