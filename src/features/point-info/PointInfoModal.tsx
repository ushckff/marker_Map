import { useEffect } from "react";
import "./PointInfoModal.css";

export type PointInfo = {
  id?: string;
  lat: number;
  lng: number;
  title?: string | null;
  address?: string | null;
  description?: string | null;
  tag?: string | null;
};

type Props = {
  open: boolean;
  point: PointInfo | null;
  onClose: () => void;
};

export default function PointInfoModal({ open, point, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !point) return null;

  const rows: Array<{ label: string; value?: string | null }> = [
    { label: "Адрес", value: point.address ?? "" },
    { label: "Описание", value: point.description ?? "" },
  ];

  const visibleRows = rows.filter(
    (r) => typeof r.value === "string" && r.value.trim().length > 0
  );

  const title =
    (typeof point.title === "string" && point.title.trim()) || "Без названия";

  return (
    <div className="pim-overlay" role="dialog" aria-modal="true">
      <div className="pim-card">
        <div className="pim-head">
          <div className="pim-title">{title}</div>
          <button
            type="button"
            className="pim-close"
            aria-label="Закрыть"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="pim-body">
          {visibleRows.length === 0 ? (
            <div className="pim-empty">Нет дополнительной информации.</div>
          ) : (
            <dl className="pim-dl">
              {visibleRows.map((row) => (
                <div className="pim-row" key={row.label}>
                  <dt className="pim-dt">{row.label}</dt>
                  <dd className="pim-dd">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <button
        type="button"
        className="pim-backdrop"
        aria-label="Закрыть окно"
        onClick={onClose}
      />
    </div>
  );
}
