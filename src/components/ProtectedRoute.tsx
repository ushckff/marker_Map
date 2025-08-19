import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

type Props = { children: React.ReactElement };

export default function ProtectedRoute({ children }: Props) {
  const user = useSelector((s: RootState) => s.user.current);
  const loading = useSelector((s: RootState) => s.user.loading);
  const loc = useLocation();

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", padding: "24px" }}>
        <div className="spinner" aria-label="Загрузка…" />
      </div>
    );
  }
  if (!user) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }
  return children;
}
