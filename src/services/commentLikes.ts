import {
  collection,
  doc,
  getDoc,
  getCountFromServer,
  query,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function isCommentLiked(
  routeId: string,
  commentId: string,
  userId: string
): Promise<boolean> {
  const ref = doc(
    db,
    "routes",
    routeId,
    "comments",
    commentId,
    "likes",
    userId
  );
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function toggleCommentLike(
  routeId: string,
  commentId: string,
  userId: string
): Promise<boolean> {
  const ref = doc(
    db,
    "routes",
    routeId,
    "comments",
    commentId,
    "likes",
    userId
  );
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { createdAt: serverTimestamp() });
  return true;
}

export async function getCommentLikesCount(
  routeId: string,
  commentId: string
): Promise<number> {
  const q = query(
    collection(db, "routes", routeId, "comments", commentId, "likes")
  );
  const agg = await getCountFromServer(q);
  return agg.data().count;
}
