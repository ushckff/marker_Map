import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  deleteDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getRouteById } from "@/services/routes";
import type { RouteWithId } from "@/entities/route/types";

const USERS = "users";
const FAV = "favorites";

function favDoc(uid: string, routeId: string) {
  return doc(db, USERS, uid, FAV, routeId);
}

export async function isFavorite(
  uid: string,
  routeId: string
): Promise<boolean> {
  const snap = await getDoc(favDoc(uid, routeId));
  return snap.exists();
}

export function watchIsFavorite(
  uid: string,
  routeId: string,
  cb: (value: boolean) => void
): Unsubscribe {
  return onSnapshot(favDoc(uid, routeId), (snap) => cb(snap.exists()));
}

export async function toggleFavorite(
  uid: string,
  routeId: string
): Promise<void> {
  const ref = favDoc(uid, routeId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { createdAt: serverTimestamp() });
  }
}

export async function listFavoriteRoutes(uid: string): Promise<RouteWithId[]> {
  if (!uid) return [];
  const col = collection(db, USERS, uid, FAV);
  const snap = await getDocs(col);

  const routes: RouteWithId[] = [];
  for (const d of snap.docs) {
    try {
      const r = await getRouteById(d.id);
      if (r) routes.push(r);
    } catch {
      continue;
    }
  }
  return routes;
}
