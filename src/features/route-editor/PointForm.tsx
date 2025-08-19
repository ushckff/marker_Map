import "./PointForm.css";
import { useEffect, useState } from "react";
import type { PlaceTag } from "@/entities/point/types";

const TAGS: { value: PlaceTag; label: string }[] = [
  { value: "architecture", label: "Архитектура" },
  { value: "bar", label: "Бар" },
  { value: "history", label: "Историческое место" },
  { value: "cafe", label: "Кофейня" },
  { value: "picnic", label: "Пикник" },
  { value: "cuisine", label: "Местная кухня" },
  { value: "museum", label: "Музей" },
  { value: "park", label: "Парк" },
  { value: "beach", label: "Пляж" },
  { value: "restaurant", label: "Ресторан" },
  { value: "theater", label: "Театр" },
  { value: "photo", label: "Фотозона" },
  { value: "other", label: "Другое" },
];

type BaseData = {
  title: string;
  description?: string;
  address?: string;
  category: PlaceTag;
  order: number;
};

type Props = {
  initialOrder: number;
  mode?: "create" | "edit";
  initialValues?: Partial<BaseData>;
  onSubmitPoint: (data: BaseData) => Promise<void> | void;
  onSaveEdit?: (data: BaseData) => Promise<void> | void;
  onCancelEdit?: () => void;
};

export default function PointForm({
  initialOrder,
  mode = "create",
  initialValues,
  onSubmitPoint,
  onSaveEdit,
  onCancelEdit,
}: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [category, setCategory] = useState<PlaceTag>(
    initialValues?.category ?? "other"
  );
  const [order, setOrder] = useState<number>(
    initialValues?.order ?? initialOrder
  );
  const [busy, setBusy] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);

  useEffect(() => {
    if (!initialValues) return;
    setTitle(initialValues.title ?? "");
    setAddress(initialValues.address ?? "");
    setDescription(initialValues.description ?? "");
    setCategory(initialValues.category ?? "other");
    setOrder(initialValues.order ?? initialOrder);
  }, [initialValues, initialOrder]);

  const hasTitleError = titleTouched && !title.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setTitleTouched(true);
      return;
    }

    const payload: BaseData = {
      title: title.trim(),
      address: address.trim() || undefined,
      description: description.trim() || undefined,
      category,
      order,
    };

    setBusy(true);
    try {
      if (mode === "edit") {
        await onSaveEdit?.(payload);
      } else {
        await onSubmitPoint(payload);
        setTitle("");
        setAddress("");
        setDescription("");
        setCategory("other");
        setOrder(initialOrder);
        setTitleTouched(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="pf-form" onSubmit={handleSubmit}>
      <label className={`pf-label ${hasTitleError ? "is-error" : ""}`}>
        {hasTitleError ? "Введите название" : "Название"}
      </label>
      <input
        className={`pf-input ${hasTitleError ? "is-invalid" : ""}`}
        placeholder="Эрмитаж"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => setTitleTouched(true)}
        aria-invalid={hasTitleError || undefined}
      />

      <label className="pf-label">Адрес (необязательно)</label>
      <input
        className="pf-input"
        placeholder="Адрес или ориентир"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <label className="pf-label">Описание (необязательно)</label>
      <textarea
        className="pf-input"
        rows={3}
        placeholder="Краткие рекомендации…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label className="pf-label">Категория</label>
      <div className="pf-tags pf-tags--chips">
        {TAGS.map((t) => (
          <button
            type="button"
            key={t.value}
            className={`tag chip ${category === t.value ? "is-active" : ""}`}
            onClick={() => setCategory(t.value)}
            aria-pressed={category === t.value}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="pf-row">
        <div className="pf-col">
          <label className="pf-label">Порядок</label>
          <input
            className="pf-input"
            type="number"
            min={1}
            step={1}
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value || "1", 10))}
          />
        </div>

        <div className="pf-col pf-actions">
          {mode === "edit" && onCancelEdit && (
            <button
              type="button"
              className="btn"
              onClick={onCancelEdit}
              disabled={busy}
              style={{ marginRight: 8 }}
            >
              Отмена
            </button>
          )}
          <button className="btn btn-primary" disabled={busy} type="submit">
            {mode === "edit" ? "Сохранить" : "Добавить место"}
          </button>
        </div>
      </div>
    </form>
  );
}
