import type { Timestamp } from "firebase/firestore";

export type PlaceTag =
  | "architecture"
  | "bar"
  | "history"
  | "cafe"
  | "picnic"
  | "cuisine"
  | "museum"
  | "park"
  | "beach"
  | "restaurant"
  | "theater"
  | "photo"
  | "other";

export type RoutePointBase = {
  title: string;
  description?: string;
  address?: string;
  photoUrl?: string;
  category: PlaceTag;
  order: number;
  lat: number;
  lng: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type NewRoutePoint = Omit<RoutePointBase, "createdAt" | "updatedAt">;

export type RoutePointWithId = RoutePointBase & { id: string };
