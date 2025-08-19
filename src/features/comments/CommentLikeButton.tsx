import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  fetchCommentLikesCount,
  isCommentLiked,
  toggleCommentLike,
  watchCommentLikesCount,
} from "@/services/likes";

import notLikedImg from "@/assets/notLiked.png";
import likedImg from "@/assets/liked.png";

type Props = { routeId: string; commentId: string };

export default function CommentLikeButton({ routeId, commentId }: Props) {
  const user = useSelector((s: RootState) => s.user.current);
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        setCount(await fetchCommentLikesCount(routeId, commentId));
      } catch (err) {
        console.error("[CommentLike] fetch count failed:", err);
        setCount(0);
      }

      if (user?.uid) {
        try {
          setLiked(await isCommentLiked(routeId, commentId, user.uid));
        } catch (err) {
          console.error("[CommentLike] isLiked failed:", err);
          setLiked(false);
        }
      } else {
        setLiked(false);
      }

      unsub = watchCommentLikesCount(routeId, commentId, (n) => setCount(n));
    })();

    return () => unsub?.();
  }, [routeId, commentId, user?.uid]);

  async function handleClick() {
    if (!user?.uid || busy) return;

    setBusy(true);
    const was = liked;
    setLiked(!was);
    setCount((c) => Math.max(0, c + (was ? -1 : 1)));

    try {
      await toggleCommentLike(routeId, commentId, user.uid);
    } catch (err) {
      console.error("[CommentLike] toggle failed:", err);
      setLiked(was);
      setCount((c) => Math.max(0, c + (was ? 1 : -1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
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
