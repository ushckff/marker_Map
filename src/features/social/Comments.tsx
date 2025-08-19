import "./Comments.css";
import { useCallback, useEffect, useState } from "react";
import { addComment, listComments } from "@/services/comments";
import type { CommentWithId } from "@/entities/comment/types";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

export default function Comments({ routeId }: { routeId: string }) {
  const user = useSelector((s: RootState) => s.user.current);
  const [items, setItems] = useState<CommentWithId[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listComments(routeId);
    setItems(res);
    setLoading(false);
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

  return (
    <div className="c-wrap">
      <h3>Комментарии</h3>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          <ul className="c-list">
            {items.map((c) => (
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
                    <span className="c-date">
                      {c.createdAt.toDate().toLocaleString()}
                    </span>
                  </div>
                  <div className="c-text">{c.text}</div>
                </div>
              </li>
            ))}
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
              <div className="c-actions">
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
