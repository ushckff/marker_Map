import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

function req(name: keyof ImportMetaEnv): string {
  const v = import.meta.env[name];
  if (!v) {
    console.error(`[Firebase] Missing ${name} in .env.local`);
    throw new Error(`Missing env ${name}`);
  }
  return v;
}

const firebaseConfig = {
  apiKey: req("VITE_FIREBASE_API_KEY"),
  authDomain: req("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: req("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: req("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: req("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: req("VITE_FIREBASE_APP_ID"),
};

const app: FirebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
