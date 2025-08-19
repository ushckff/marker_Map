import type { Timestamp } from "firebase/firestore";

export type CommentBase = {
  userId: string;
  userName?: string | null;
  userPhotoUrl?: string | null;
  text: string;
  createdAt: Timestamp;
};

export type NewComment = {
  userId: string;
  userName?: string | null;
  userPhotoUrl?: string | null;
  text: string;
};

export type CommentWithId = CommentBase & { id: string };
