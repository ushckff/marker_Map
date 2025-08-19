import "./PointsList.css";
import type { RoutePointWithId, PlaceTag } from "@/entities/point/types";
import trashIcon from "/assets/trash.png";
import editIcon from "/assets/edit.png";

type Props = {
  items: RoutePointWithId[];
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
};

const TAG_RU: Record<PlaceTag, string> = {
  architecture: "Архитектура",
  bar: "Бар",
  history: "Историческое место",
  cafe: "Кофейня",
  picnic: "Пикник",
  cuisine: "Местная кухня",
  museum: "Музей",
  park: "Парк",
  beach: "Пляж",
  restaurant: "Ресторан",
  theater: "Театр",
  photo: "Фотозона",
  other: "Другое",
};

export default function PointsList({
  items,
  onMoveUp,
  onMoveDown,
  onDelete,
  onEdit,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="pl-panel">
        <div className="pl-empty">
          <div className="pl-empty-title">Точек пока нет</div>
          <div className="pl-empty-desc">
            Кликните по карте, затем заполните форму слева.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-panel">
      <ul className="pl-list">
        {items
          .sort((a, b) => a.order - b.order)
          .map((p, idx) => (
            <li key={p.id} className="pl-item">
              <div className="pl-order">{p.order}</div>

              <div className="pl-body">
                <div className="pl-title">{p.title}</div>
                <div className="pl-meta">
                  <span className="pl-tag">{TAG_RU[p.category]}</span>
                </div>
              </div>

              <div className="pl-actions">
                <button
                  className="btn"
                  disabled={idx === 0}
                  onClick={() => onMoveUp(p.id)}
                  title="Вверх"
                >
                  ↑
                </button>
                <button
                  className="btn"
                  disabled={idx === items.length - 1}
                  onClick={() => onMoveDown(p.id)}
                  title="Вниз"
                >
                  ↓
                </button>
                <button
                  className="icon-btn edit"
                  onClick={() => onEdit(p.id)}
                  title="Изменить"
                >
                  <img className="icon" src={editIcon} alt="" />
                </button>
                <button
                  className="icon-btn trash"
                  onClick={() => onDelete(p.id)}
                  title="Удалить"
                >
                  <img className="icon" src={trashIcon} alt="" />
                </button>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}
