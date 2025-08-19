import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  isFavorite,
  toggleFavorite,
  watchIsFavorite,
} from "@/services/favorites";

// твои иконки
import notFavoriteImg from "/assets/notFavorite.png";
import favoriteImg from "/assets/favorite.png";

type Props = { routeId: string };

export default function FavoriteButton({ routeId }: Props) {
  const user = useSelector((s: RootState) => s.user.current);
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      if (!user?.uid) {
        setFav(false);
        return;
      }
      try {
        setFav(await isFavorite(user.uid, routeId));
      } catch (err) {
        console.error("[Favorite] isFavorite failed:", err);
      }
      unsub = watchIsFavorite(user.uid, routeId, setFav);
    })();
    return () => unsub?.();
  }, [routeId, user?.uid]);

  async function handleClick() {
    if (!user?.uid || busy) return;
    setBusy(true);
    const prev = fav;
    setFav(!prev); // оптимистично
    try {
      await toggleFavorite(user.uid, routeId);
    } catch (err) {
      console.error("[Favorite] toggle failed:", err);
      setFav(prev); // откат
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`icon-btn fav-btn${fav ? " is-active" : ""}`}
      onClick={handleClick}
      title={fav ? "Убрать из избранного" : "В избранное"}
      aria-label={fav ? "Убрать из избранного" : "Добавить в избранное"}
      disabled={!user || busy}
    >
      <img
        src={fav ? favoriteImg : notFavoriteImg}
        alt=""
        className="icon-img"
        draggable={false}
      />
    </button>
  );
}
