import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { current: user, loading } = useSelector((s: RootState) => s.user);
  const location = useLocation();

  if (loading) return <p>Загрузка...</p>;
  if (!user) {
    return (
      <Navigate to="/auth/signin" replace state={{ from: location.pathname }} />
    );
  }
  return <>{children}</>;
}
