import { auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";

export type UpdateMyProfileParams = {
  displayName?: string;
  file?: File;
};

export type UpdateMyProfileResult = {
  displayName: string | null;
  photoURL: string | null;
};

export async function updateMyProfile(
  params: UpdateMyProfileParams
): Promise<UpdateMyProfileResult> {
  const u = auth.currentUser;
  if (!u) throw new Error("Пользователь не авторизован");

  const nextDisplayName: string | null =
    params.displayName ?? u.displayName ?? null;

  const nextPhotoURL: string | null = u.photoURL ?? null;

  await updateProfile(u, {
    displayName: nextDisplayName ?? undefined,
    photoURL: nextPhotoURL ?? undefined,
  });

  return { displayName: nextDisplayName, photoURL: nextPhotoURL };
}
