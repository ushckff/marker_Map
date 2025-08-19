import "./HomePage.css";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { listPublicRoutes, type ListParams } from "@/services/routes";
import type { RouteWithId } from "@/entities/route/types";
import LikeButton from "@/features/social/LikeButton";
import FavoriteButton from "@/features/social/FavoriteButton";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function useDebounced(value: string, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return v;
}

function isFsTimestamp(v: unknown): v is { toDate: () => Date } {
  return typeof v === "object" && v !== null && "toDate" in (v as object);
}

function daysLabel(n: number): string {
  return n >= 1 && n <= 3 ? `${n} дня` : `${n} дней`;
}

export default function HomePage() {
  const user = useSelector((s: RootState) => s.user.current);

  const [routes, setRoutes] = useState<RouteWithId[]>([]);
  const [city, setCity] = useState("");
  const [sortBy, setSortBy] = useState<ListParams["sortBy"]>("new");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});

  const debouncedCity = useDebounced(city.trim());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPublicRoutes({
        city: debouncedCity || undefined,
        sortBy,
        currentUserId: user?.uid,
        limit: 30,
      });
      setRoutes(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setRoutes([]);
      console.error("[Home] listPublicRoutes failed:", e);
    } finally {
      setLoading(false);
    }
  }, [debouncedCity, sortBy, user?.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (routes.length === 0) return;

    const uniqueOwnerIds = Array.from(new Set(routes.map((r) => r.ownerId)));
    const need = uniqueOwnerIds.filter((id) => !ownerNames[id]);
    if (need.length === 0) return;

    (async () => {
      const updates: Record<string, string> = {};
      await Promise.all(
        need.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
              const d = snap.data() as Record<string, unknown>;
              let name = "";
              if (typeof d.displayName === "string" && d.displayName.trim())
                name = d.displayName.trim();
              else if (typeof d.name === "string" && d.name.trim())
                name = d.name.trim();
              else if (typeof d.email === "string")
                name = (d.email as string).split("@")[0];
              updates[uid] = name || "Пользователь";
            } else {
              updates[uid] = "Пользователь";
            }
          } catch {
            updates[uid] = "Пользователь";
          }
        })
      );
      if (Object.keys(updates).length) {
        setOwnerNames((prev) => ({ ...prev, ...updates }));
      }
    })();
  }, [routes, ownerNames]);

  return (
    <div className="home-wrap">
      <h1 className="home-title">Главная</h1>

      <div className="home-toolbar">
        <input
          className="home-input"
          placeholder="Поиск по городу"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <select
          className="home-input home-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as ListParams["sortBy"])}
        >
          <option value="new">Новые</option>
          <option value="favorites">Избранные</option>
        </select>
      </div>

      {loading && <p className="home-note">Загрузка…</p>}
      {!loading && error && <p className="home-err">Ошибка: {error}</p>}
      {!loading && !error && routes.length === 0 && (
        <p className="home-note">Маршруты ещё не добавлены.</p>
      )}

      {!loading && !error && routes.length > 0 && (
        <ul className="home-grid">
          {routes.map((r) => {
            const date = isFsTimestamp(r.createdAt)
              ? r.createdAt.toDate()
              : undefined;
            const dateStr = date
              ? date.toLocaleDateString("ru-RU", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "—";

            const ownerDisplay =
              ((r as unknown as Record<string, unknown>).ownerDisplayName as
                | string
                | undefined) ||
              ownerNames[r.ownerId] ||
              "Пользователь";

            return (
              <li key={r.id} className="card">
                {r.coverPhotoUrl && (
                  <Link
                    to={`/route/${r.id}`}
                    className="card-cover-link"
                    aria-label={r.title}
                  >
                    <img
                      className="card-cover"
                      src={r.coverPhotoUrl}
                      alt={r.title}
                    />
                  </Link>
                )}

                <div className="card-body">
                  <Link to={`/route/${r.id}`} className="card-title">
                    {r.title}
                  </Link>

                  <div className="card-line muted">Автор: {ownerDisplay}</div>

                  <div className="card-line">
                    {r.city || "—"} <span className="meta-dot">•</span>{" "}
                    {daysLabel(r.days)}
                  </div>

                  <div className="card-line muted">{dateStr}</div>

                  <div className="card-actions">
                    <LikeButton routeId={r.id} />
                    <FavoriteButton routeId={r.id} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
