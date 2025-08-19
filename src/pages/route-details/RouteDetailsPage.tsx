import "./RouteDetailsPage.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "@/store/store";
import type { RouteWithId } from "@/entities/route/types";
import type { RoutePointWithId } from "@/entities/point/types";

import { getRouteById, deleteRoute } from "@/services/routes";
import { listPoints } from "@/services/points";

import YMap from "@/widgets/map/YMap";
import PointsEditor from "@/features/route-editor/PointsEditor";
import LikeButton from "@/features/social/LikeButton";
import FavoriteButton from "@/features/social/FavoriteButton";
import Comments from "@/features/comments/Comments";

import trashIcon from "/assets/trash.png";

import PointInfoModal, {
  PointInfo,
} from "@/features/point-info/PointInfoModal";

export default function RouteDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const user = useSelector((s: RootState) => s.user.current);
  const nav = useNavigate();

  const [route, setRoute] = useState<RouteWithId | null>(null);
  const [points, setPoints] = useState<RoutePointWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPoint, setSelectedPoint] = useState<PointInfo | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await getRouteById(id);
        const pts = await listPoints(id);
        if (!mounted) return;
        setRoute(r);
        setPoints(pts);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!id) return <p className="rd-wrap">Маршрут не найден</p>;
  if (loading) return <p className="rd-wrap">Загрузка...</p>;
  if (error)
    return (
      <p className="rd-wrap" style={{ color: "#c62828" }}>
        Ошибка: {error}
      </p>
    );
  if (!route) return <p className="rd-wrap">Маршрут не найден</p>;

  const isOwner = !!user && user.uid === route.ownerId;

  async function handleShare() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert("Ссылка скопирована");
    } catch {
      prompt("Скопируйте ссылку:", url);
    }
  }

  async function handleDelete() {
    if (!isOwner) return;
    if (!confirm("Удалить маршрут?")) return;
    await deleteRoute(id);
    nav("/");
  }

  return (
    <div className="rd-wrap">
      <div className="rd-header">
        <div>
          <h1 className="rd-title">{route.title}</h1>
          <div className="rd-meta">
            {route.city} • {route.days} дн.
            <span className={`rd-badge rd-${route.visibility}`}>
              {route.visibility === "public"
                ? "Публичный"
                : route.visibility === "unlisted"
                ? "По ссылке"
                : "Приватный"}
            </span>
          </div>
        </div>

        <div className="rd-head-actions">
          <button
            type="button"
            className="btn rd-share"
            onClick={() => void handleShare()}
          >
            Поделиться
          </button>

          <div className="rd-icons-row">
            <LikeButton routeId={route.id} />
            <FavoriteButton routeId={route.id} />

            {isOwner && (
              <button
                type="button"
                className="icon-btn trash"
                onClick={() => void handleDelete()}
                title="Удалить маршрут"
                aria-label="Удалить маршрут"
              >
                <img className="icon" src={trashIcon} alt="" />
              </button>
            )}
          </div>
        </div>
      </div>

      {route.coverPhotoUrl && (
        <img className="rd-cover" src={route.coverPhotoUrl} alt={route.title} />
      )}

      {isOwner ? (
        <PointsEditor routeId={id} city={route.city} />
      ) : (
        <div className="rd-map">
          <YMap
            points={points.map((p) => ({
              id: p.id,
              lat: p.lat,
              lng: p.lng,
              title: p.title ?? "",
              address: (p as { address?: string }).address ?? "",
              description: (p as { description?: string }).description ?? "",
              category: p.category ?? "other",
            }))}
            city={route.city}
            onMarkerClick={(pt) => {
              setSelectedPoint(pt);
              setIsPopupOpen(true);
            }}
          />
        </div>
      )}

      <PointInfoModal
        open={isPopupOpen}
        point={selectedPoint}
        onClose={() => setIsPopupOpen(false)}
      />

      <Comments routeId={id} ownerId={route.ownerId} />
    </div>
  );
}
