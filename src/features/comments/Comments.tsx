import "./Comments.css";
import { useCallback, useEffect, useState } from "react";
import { addComment, listComments, deleteComment } from "@/services/comments";
import type { CommentWithId } from "@/entities/comment/types";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import CommentLikeButton from "./CommentLikeButton";
import trashIcon from "/assets/trash.png";

type Props = {
  routeId: string;
  ownerId: string;
};

type ExtendedComment = CommentWithId & {
  userId?: string;
  authorId?: string;
  userName?: string;
  userPhotoUrl?: string | null;
  createdAt?: unknown;
};

function hasToDate(v: unknown): v is { toDate: () => Date } {
  return (
    typeof v === "object" &&
    v !== null &&
    "toDate" in v &&
    typeof (v as { toDate: unknown }).toDate === "function"
  );
}

function fmtDate(v: unknown): string {
  try {
    if (hasToDate(v)) return v.toDate().toLocaleString();
    if (v instanceof Date) return v.toLocaleString();
    if (typeof v === "number" || typeof v === "string") {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    }
  } catch {
    /* ignore */
  }
  return "";
}

export default function Comments({ routeId, ownerId }: Props) {
  const user = useSelector((s: RootState) => s.user.current);
  const [items, setItems] = useState<ExtendedComment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const canDelete = (
    userId: string | undefined,
    commentUserId: string | undefined
  ) =>
    !!userId &&
    !!commentUserId &&
    (userId === commentUserId || userId === ownerId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listComments(routeId);
      setItems(res as ExtendedComment[]);
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSend() {
    const t = text.trim();
    if (!user || !t) return;
    await addComment(routeId, {
      userId: user.uid,
      userName: user.displayName ?? user.email,
      userPhotoUrl: user.photoURL ?? null,
      text: t,
    });
    setText("");
    await load();
  }

  async function handleDelete(
    commentId: string,
    commentUserId: string | undefined
  ) {
    const currentUid = user?.uid;
    if (!currentUid || !canDelete(currentUid, commentUserId)) return;
    if (!confirm("Удалить комментарий?")) return;
    await deleteComment(routeId, commentId);
    await load();
  }

  return (
    <div className="c-wrap">
      <h3>Комментарии</h3>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          <ul className="c-list">
            {items.map((c) => {
              const authorId = c.userId ?? c.authorId ?? "";
              const showDelete = canDelete(user?.uid, authorId);

              return (
                <li key={c.id} className="c-item">
                  <img
                    className="c-ava"
                    src={
                      c.userPhotoUrl ||
                      "https://dummyimage.com/32x32/ddd/fff.png&text=U"
                    }
                    alt=""
                  />
                  <div className="c-body">
                    <div className="c-head">
                      <span className="c-name">{c.userName || "Гость"}</span>
                      <span className="c-date">{fmtDate(c.createdAt)}</span>

                      <div className="c-actions">
                        <CommentLikeButton routeId={routeId} commentId={c.id} />
                        {showDelete && (
                          <button
                            type="button"
                            className="icon-btn trash"
                            onClick={() => void handleDelete(c.id, authorId)}
                            aria-label="Удалить"
                            title="Удалить"
                          >
                            <img className="icon" src={trashIcon} alt="" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="c-text">{c.text}</div>
                  </div>
                </li>
              );
            })}
          </ul>

          {!user ? (
            <p className="c-note">Войдите, чтобы оставить комментарий.</p>
          ) : (
            <div className="c-form">
              <textarea
                rows={3}
                maxLength={2000}
                placeholder="Написать комментарий..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="c-actions-row">
                <button
                  className="btn"
                  disabled={!text.trim()}
                  onClick={() => void handleSend()}
                >
                  Отправить
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
