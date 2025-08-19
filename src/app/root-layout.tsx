import "./root.css";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import AuthWatcher from "@/pages/auth/AuthWatcher";
import placeholder from "@/assets/profile.png";

export default function RootLayout() {
  const user = useSelector((s: RootState) => s.user.current);
  const loading = useSelector((s: RootState) => s.user.loading);
  const loc = useLocation();

  const isActive = (path: string) => (loc.pathname === path ? "is-active" : "");

  return (
    <div className="app">
      <AuthWatcher />

      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="brand">
            <span className="brand__text">markerMap</span>
          </Link>

          <nav className="nav">
            <NavLink className={`nav__link ${isActive("/")}`} to="/">
              Главная
            </NavLink>
            <NavLink
              className={`nav__link ${isActive("/create")}`}
              to="/create"
            >
              Создать маршрут
            </NavLink>
          </nav>

          <div className="userbox">
            {loading ? (
              <div className="spinner" aria-label="Загрузка…" />
            ) : user ? (
              <Link to="/profile" className="userbox__me">
                <img
                  src={placeholder}
                  alt="avatar"
                  className="userbox__avatar"
                />
                <span className="userbox__name">
                  {user.displayName ?? "Профиль"}
                </span>
              </Link>
            ) : (
              <Link to="/auth" className="btn btn-primary">
                Войти / Регистрация
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <small>© {new Date().getFullYear()} markerMap</small>
      </footer>
    </div>
  );
}
