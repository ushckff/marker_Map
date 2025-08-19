import { useEffect, useMemo, useState, useCallback } from "react";
import {
  addPoint,
  deletePoint,
  listPoints,
  updatePoint,
} from "@/services/points";
import type { RoutePointWithId, NewRoutePoint } from "@/entities/point/types";
import YMap from "@/widgets/map/YMap";
import PointForm from "./PointForm";
import PointsList from "./PointsList";
import "./PointsEditor.css";

type Props = {
  routeId: string;
  city?: string;
};

export default function PointsEditor({ routeId, city }: Props) {
  const [items, setItems] = useState<RoutePointWithId[]>([]);
  const [loading, setLoading] = useState(true);

  const [pickedCoords, setPickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [editing, setEditing] = useState<RoutePointWithId | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const pts = await listPoints(routeId);
    setItems(pts);
    setLoading(false);
  }, [routeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const nextOrder = useMemo(() => {
    if (items.length === 0) return 1;
    const max = items.reduce(
      (m, p) => (p.order > m ? p.order : m),
      items[0].order
    );
    return max + 1;
  }, [items]);

  async function handleAdd(p: NewRoutePoint) {
    const lat =
      typeof p.lat === "number" && Number.isFinite(p.lat)
        ? p.lat
        : pickedCoords?.lat;
    const lng =
      typeof p.lng === "number" && Number.isFinite(p.lng)
        ? p.lng
        : pickedCoords?.lng;

    if (lat == null || lng == null) {
      alert("Сначала кликните по карте, чтобы выбрать место.");
      return;
    }

    await addPoint(routeId, { ...p, lat, lng });
    setPickedCoords(null);
    await load();
  }

  async function handleSaveEdit(data: {
    title: string;
    description?: string;
    address?: string;
    category: RoutePointWithId["category"];
    order: number;
  }) {
    if (!editing) return;

    await updatePoint(routeId, editing.id, {
      title: data.title,
      description: data.description,
      address: data.address,
      category: data.category,
      order: data.order,
    });

    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    await deletePoint(routeId, id);
    await load();
  }

  async function handleMove(id: string, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;

    const a = items[idx];
    const b = items[j];

    await updatePoint(routeId, a.id, { order: b.order });
    await updatePoint(routeId, b.id, { order: a.order });
    await load();
  }

  const initialValues =
    editing == null
      ? undefined
      : {
          title: editing.title,
          address: editing.address,
          description: editing.description,
          category: editing.category,
          order: editing.order,
        };

  return (
    <div className="pe-wrap">
      <h3>Точки маршрута</h3>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          <YMap
            points={items.map((p) => ({
              lat: p.lat,
              lng: p.lng,
              title: p.title,
              order: p.order,
              category: p.category,
            }))}
            onMapClick={(c) => {
              if (editing) return;
              setPickedCoords(c);
            }}
            city={city}
            zoom={13}
          />

          {editing === null && (
            <div className="pe-hint">
              Кликните по карте, чтобы выбрать координаты для новой точки.
              {pickedCoords && (
                <span className="pe-picked">
                  Выбрано: {pickedCoords.lat.toFixed(5)},{" "}
                  {pickedCoords.lng.toFixed(5)}{" "}
                  <button
                    type="button"
                    className="pe-clear"
                    onClick={() => setPickedCoords(null)}
                    title="Сбросить выбор"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          )}

          <div className="pe-grid">
            <div>
              <h4>{editing ? "Изменить место" : "Добавить место"}</h4>

              <PointForm
                mode={editing ? "edit" : "create"}
                initialOrder={nextOrder}
                initialValues={initialValues}
                onSubmitPoint={handleAdd}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={() => {
                  setEditing(null);
                }}
              />
            </div>

            <div>
              <h4>Список</h4>
              <PointsList
                items={items}
                onMoveUp={(id) => void handleMove(id, -1)}
                onMoveDown={(id) => void handleMove(id, +1)}
                onDelete={(id) => void handleDelete(id)}
                onEdit={(id) => {
                  const pt = items.find((x) => x.id === id) ?? null;
                  setEditing(pt);
                  setPickedCoords(null);
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
