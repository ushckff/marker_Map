import {
  addDoc,
  collection,
  orderBy,
  query,
  getDocs,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewComment, CommentWithId } from "@/entities/comment/types";
import { deleteDoc, doc } from "firebase/firestore";

const ROUTES = "routes";
const COMMENTS = "comments";

function snapToComment(s: QueryDocumentSnapshot<DocumentData>): CommentWithId {
  const d = s.data();
  return {
    id: s.id,
    userId: String(d.userId),
    userName: (d.userName ?? null) as string | null,
    userPhotoUrl: (d.userPhotoUrl ?? null) as string | null,
    text: String(d.text),
    createdAt: d.createdAt,
  };
}

export async function addComment(
  routeId: string,
  payload: NewComment
): Promise<string> {
  const ref = await addDoc(collection(db, ROUTES, routeId, COMMENTS), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteComment(
  routeId: string,
  commentId: string
): Promise<void> {
  await deleteDoc(doc(db, ROUTES, routeId, COMMENTS, commentId));
}

export async function listComments(routeId: string): Promise<CommentWithId[]> {
  const q = query(
    collection(db, ROUTES, routeId, COMMENTS),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(snapToComment);
}
