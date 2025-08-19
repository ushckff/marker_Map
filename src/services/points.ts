import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewRoutePoint, RoutePointWithId } from "@/entities/point/types";

const ROUTES = "routes";
const POINTS = "points";

function snapToPoint(s: QueryDocumentSnapshot<DocumentData>): RoutePointWithId {
  const d = s.data();
  return {
    id: s.id,
    order: Number(d.order),
    category: String(d.category) as RoutePointWithId["category"],
    title: String(d.title),
    description: d.description ? String(d.description) : undefined,
    address: d.address ? String(d.address) : undefined,
    lat: Number(d.lat),
    lng: Number(d.lng),
    photoUrl: d.photoUrl ? String(d.photoUrl) : undefined,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export async function listPoints(routeId: string): Promise<RoutePointWithId[]> {
  const q = query(
    collection(db, ROUTES, routeId, POINTS),
    orderBy("order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(snapToPoint);
}

export async function addPoint(
  routeId: string,
  point: NewRoutePoint
): Promise<string> {
  const now = serverTimestamp();

  const data: Record<string, unknown> = {
    title: point.title,
    order: point.order,
    category: point.category,
    lat: point.lat,
    lng: point.lng,
    createdAt: now,
    updatedAt: now,
  };

  if (point.address && point.address.trim())
    data.address = point.address.trim();
  if (point.description && point.description.trim())
    data.description = point.description.trim();
  if (point.photoUrl && point.photoUrl.trim())
    data.photoUrl = point.photoUrl.trim();

  const ref = await addDoc(collection(db, ROUTES, routeId, POINTS), data);
  return ref.id;
}

export async function updatePoint(
  routeId: string,
  pointId: string,
  patch: Partial<NewRoutePoint>
): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (patch.title !== undefined) data.title = patch.title;
  if (patch.order !== undefined) data.order = patch.order;
  if (patch.category !== undefined) data.category = patch.category;
  if (patch.lat !== undefined) data.lat = patch.lat;
  if (patch.lng !== undefined) data.lng = patch.lng;

  if (typeof patch.address === "string") {
    if (patch.address.trim()) data.address = patch.address.trim();
  }
  if (typeof patch.description === "string") {
    if (patch.description.trim()) data.description = patch.description.trim();
  }
  if (typeof patch.photoUrl === "string") {
    if (patch.photoUrl.trim()) data.photoUrl = patch.photoUrl.trim();
  }

  const ref = doc(db, ROUTES, routeId, POINTS, pointId);
  await updateDoc(ref, data);
}

export async function deletePoint(
  routeId: string,
  pointId: string
): Promise<void> {
  const ref = doc(db, ROUTES, routeId, POINTS, pointId);
  await deleteDoc(ref);
}
