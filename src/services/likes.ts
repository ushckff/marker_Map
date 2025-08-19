import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const routeLikesCol = (routeId: string) =>
  collection(db, "routes", routeId, "likes");

export async function fetchRouteLikesCount(routeId: string): Promise<number> {
  const snap = await getDocs(routeLikesCol(routeId));
  return snap.size;
}
export function watchRouteLikesCount(
  routeId: string,
  cb: (n: number) => void
): Unsubscribe {
  return onSnapshot(routeLikesCol(routeId), (snap) => cb(snap.size));
}
export async function isRouteLiked(routeId: string, userId: string) {
  const d = await getDoc(doc(routeLikesCol(routeId), userId));
  return d.exists();
}
export async function toggleRouteLike(routeId: string, userId: string) {
  const ref = doc(routeLikesCol(routeId), userId);
  const cur = await getDoc(ref);
  if (cur.exists()) await deleteDoc(ref);
  else await setDoc(ref, { createdAt: serverTimestamp() });
}

const commentLikesCol = (routeId: string, commentId: string) =>
  collection(db, "routes", routeId, "comments", commentId, "likes");

export async function fetchCommentLikesCount(
  routeId: string,
  commentId: string
): Promise<number> {
  const snap = await getDocs(commentLikesCol(routeId, commentId));
  return snap.size;
}

export function watchCommentLikesCount(
  routeId: string,
  commentId: string,
  cb: (n: number) => void
): Unsubscribe {
  return onSnapshot(commentLikesCol(routeId, commentId), (snap) =>
    cb(snap.size)
  );
}

export async function isCommentLiked(
  routeId: string,
  commentId: string,
  userId: string
): Promise<boolean> {
  const d = await getDoc(doc(commentLikesCol(routeId, commentId), userId));
  return d.exists();
}

export async function toggleCommentLike(
  routeId: string,
  commentId: string,
  userId: string
): Promise<void> {
  const ref = doc(commentLikesCol(routeId, commentId), userId);
  const cur = await getDoc(ref);
  if (cur.exists()) await deleteDoc(ref);
  else await setDoc(ref, { createdAt: serverTimestamp() });
}
