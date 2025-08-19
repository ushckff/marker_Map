import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { db, auth } from "@/lib/firebase";
import type { NewRoute, RouteWithId } from "@/entities/route/types";

const ROUTES = "routes";

function snapToRoute(s: QueryDocumentSnapshot<DocumentData>): RouteWithId {
  const d = s.data();

  const visibility =
    d.visibility === "public" || d.visibility === "unlisted"
      ? (d.visibility as "public" | "unlisted")
      : d.isPublic
      ? "public"
      : "unlisted";

  const extra: Record<string, unknown> = {};
  if (typeof d.ownerDisplayName === "string" && d.ownerDisplayName.trim()) {
    extra.ownerDisplayName = String(d.ownerDisplayName);
  }

  return {
    id: s.id,
    title: String(d.title),
    city: String(d.city),
    days: Number(d.days),
    isPublic: Boolean(d.isPublic),
    visibility,
    coverPhotoUrl: d.coverPhotoUrl ? String(d.coverPhotoUrl) : undefined,
    likesCount: Number(d.likesCount ?? 0),
    ownerId: String(d.ownerId),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    ...extra,
  } as RouteWithId;
}

function isIndexError(e: unknown): e is FirebaseError {
  return (
    e instanceof FirebaseError &&
    e.code === "failed-precondition" &&
    /index/i.test(e.message)
  );
}

export async function createRoute(payload: NewRoute): Promise<string> {
  const now = serverTimestamp();

  const u = auth.currentUser;
  const ownerDisplayName =
    (u?.displayName && u.displayName.trim()) ||
    (u?.email ? u.email.split("@")[0] : "") ||
    "Пользователь";

  const data: Record<string, unknown> = {
    title: payload.title,
    city: payload.city,
    days: payload.days,
    visibility: payload.visibility,
    isPublic: payload.visibility === "public",
    ownerId: payload.ownerId,
    ownerDisplayName,
    likesCount: 0,
    commentsCount: 0,
    favoritesCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (payload.coverPhotoUrl) data.coverPhotoUrl = payload.coverPhotoUrl;

  const ref = await addDoc(collection(db, ROUTES), data);
  return ref.id;
}

export type ListParams = {
  city?: string;
  sortBy?: "new" | "favorites";
  currentUserId?: string;
  limit?: number;
};

async function fetchFavoriteRouteIds(userId: string): Promise<Set<string>> {
  const col = collection(db, "users", userId, "favorites");
  const snap = await getDocs(col);
  const ids = new Set<string>();
  snap.forEach((d) => ids.add(d.id));
  return ids;
}

export async function listPublicRoutes(
  params: ListParams = {}
): Promise<RouteWithId[]> {
  const { city, sortBy = "new", currentUserId, limit = 20 } = params;

  const filters: ReturnType<typeof where>[] = [where("isPublic", "==", true)];
  if (city && city.trim()) filters.push(where("city", "==", city.trim()));

  const hardLimit = sortBy === "favorites" ? Math.max(limit * 2, 60) : limit;

  try {
    const q = query(
      collection(db, ROUTES),
      ...filters,
      orderBy("createdAt", "desc"),
      fsLimit(hardLimit)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(snapToRoute);

    if (sortBy !== "favorites" || !currentUserId) {
      return list.slice(0, limit);
    }

    const favIds = await fetchFavoriteRouteIds(currentUserId);
    if (favIds.size === 0) return list.slice(0, limit);

    const fav: RouteWithId[] = [];
    const rest: RouteWithId[] = [];
    for (const r of list) {
      (favIds.has(r.id) ? fav : rest).push(r);
    }

    return [...fav, ...rest].slice(0, limit);
  } catch (e) {
    if (!isIndexError(e)) throw e;
    const q = query(collection(db, ROUTES), ...filters, fsLimit(200));
    const snap = await getDocs(q);
    const list = snap.docs.map(snapToRoute);

    list.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    if (sortBy !== "favorites" || !currentUserId) {
      return list.slice(0, limit);
    }

    const favIds = await fetchFavoriteRouteIds(currentUserId);
    if (favIds.size === 0) return list.slice(0, limit);

    const fav: RouteWithId[] = [];
    const rest: RouteWithId[] = [];
    for (const r of list) {
      (favIds.has(r.id) ? fav : rest).push(r);
    }
    return [...fav, ...rest].slice(0, limit);
  }
}

export async function getRouteById(id: string): Promise<RouteWithId | null> {
  const ref = doc(db, ROUTES, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const d = snap.data() as DocumentData;

  const visibility =
    d.visibility === "public" || d.visibility === "unlisted"
      ? (d.visibility as "public" | "unlisted")
      : d.isPublic
      ? "public"
      : "unlisted";

  return {
    id: snap.id,
    title: String(d.title),
    city: String(d.city),
    days: Number(d.days),
    isPublic: Boolean(d.isPublic),
    visibility,
    coverPhotoUrl: d.coverPhotoUrl ? String(d.coverPhotoUrl) : undefined,
    likesCount: Number(d.likesCount ?? 0),
    ownerId: String(d.ownerId),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export async function updateRoute(
  id: string,
  patch: Partial<NewRoute>
): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (patch.title !== undefined) data.title = patch.title;
  if (patch.city !== undefined) data.city = patch.city;
  if (patch.days !== undefined) data.days = patch.days;

  if (
    (patch as Partial<NewRoute> & { coverPhotoUrl?: string }).coverPhotoUrl !==
    undefined
  ) {
    data.coverPhotoUrl =
      (patch as { coverPhotoUrl?: string }).coverPhotoUrl ?? null;
  }

  if (patch.visibility !== undefined) {
    data.visibility = patch.visibility;
    data.isPublic = patch.visibility === "public";
  }

  await updateDoc(doc(db, ROUTES, id), data);
}

export async function deleteRoute(id: string): Promise<void> {
  await deleteDoc(doc(db, ROUTES, id));
}

export async function listUserRoutes(ownerId: string): Promise<RouteWithId[]> {
  try {
    const q = query(
      collection(db, ROUTES),
      where("ownerId", "==", ownerId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(snapToRoute);
  } catch (e) {
    if (!isIndexError(e)) throw e;
    const q = query(collection(db, ROUTES), where("ownerId", "==", ownerId));
    const snap = await getDocs(q);
    return snap.docs
      .map(snapToRoute)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }
}
