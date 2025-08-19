import type { Timestamp } from "firebase/firestore";

export type RouteVisibility = "public" | "unlisted";

export type RouteBase = {
  title: string;
  city: string;
  days: number;
  isPublic: boolean;
  visibility: RouteVisibility;
  coverPhotoUrl?: string;
  likesCount: number;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type NewRoute = {
  title: string;
  city: string;
  days: number;
  visibility: RouteVisibility;
  coverPhotoUrl?: string;
  ownerId: string;
};

export type RouteWithId = RouteBase & { id: string };
