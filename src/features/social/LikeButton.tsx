import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  fetchRouteLikesCount,
  isRouteLiked,
  toggleRouteLike,
  watchRouteLikesCount,
} from "@/services/likes";

import notLikedImg from "@/assets/notLiked.png";
import likedImg from "@/assets/liked.png";

type Props = { routeId: string };

export default function LikeButton({ routeId }: Props) {
  const user = useSelector((s: RootState) => s.user.current);
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        const initial = await fetchRouteLikesCount(routeId);
        setCount(initial);
      } catch (err) {
        console.error("[LikeButton] fetchRouteLikesCount failed:", err);
        setCount(0);
      }

      if (user?.uid) {
        try {
          const v = await isRouteLiked(routeId, user.uid);
          setLiked(v);
        } catch (err) {
          console.error("[LikeButton] isRouteLiked failed:", err);
          setLiked(false);
        }
      } else {
        setLiked(false);
      }

      unsub = watchRouteLikesCount(routeId, (n) => setCount(n));
    })();

    return () => unsub?.();
  }, [routeId, user?.uid]);

  async function handleClick() {
    if (!user?.uid || busy) return;

    setBusy(true);

    const was = liked;
    setLiked(!was);
    setCount((c) => Math.max(0, c + (was ? -1 : 1)));

    try {
      await toggleRouteLike(routeId, user.uid);
    } catch (err) {
      console.error("[LikeButton] toggleRouteLike failed:", err);
      setLiked(was);
      setCount((c) => Math.max(0, c + (was ? 1 : -1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`icon-btn like-btn${liked ? " is-active" : ""}`}
      onClick={handleClick}
      aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
      title={liked ? "Убрать лайк" : "Поставить лайк"}
      disabled={!user || busy}
    >
      <img
        src={liked ? likedImg : notLikedImg}
        alt=""
        className="icon-img"
        draggable={false}
      />
      <span className="like-count" aria-label={`Лайков: ${count}`}>
        {count}
      </span>
    </button>
  );
}
