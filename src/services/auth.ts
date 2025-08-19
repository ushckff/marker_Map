import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
};

export function mapUser(u: User): AppUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    emailVerified: u.emailVerified,
  };
}

export function observeAuth(cb: (user: AppUser | null) => void): () => void {
  return onAuthStateChanged(auth, (u) => cb(u ? mapUser(u) : null));
}

export async function signInEmail(
  email: string,
  password: string
): Promise<AppUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return mapUser(user);
}

export async function signUpEmail(params: {
  email: string;
  password: string;
  displayName?: string;
  verifyEmail?: boolean;
}): Promise<AppUser> {
  const { email, password, displayName, verifyEmail = true } = params;
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  if (verifyEmail && !cred.user.emailVerified) {
    void sendEmailVerification(cred.user).catch(() => void 0);
  }
  return mapUser(cred.user);
}

/** Вход через Google */
export async function signInWithGoogle(): Promise<AppUser> {
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  return mapUser(user);
}

/** Выход */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
