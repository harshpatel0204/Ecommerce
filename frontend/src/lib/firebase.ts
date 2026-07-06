import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Real Firebase auth needs ALL of these. If any are missing, fall back to mock
// mode instead of half-initializing (which throws auth/configuration-not-found).
const REQUIRED: (keyof typeof firebaseConfig)[] = ["apiKey", "authDomain", "projectId", "appId"];
const missing = REQUIRED.filter((k) => !firebaseConfig[k]);
const hasFirebaseConfig = missing.length === 0;

if (!hasFirebaseConfig && (firebaseConfig.apiKey || firebaseConfig.projectId)) {
  // Partially configured — warn so it's obvious why real login isn't used.
  console.warn(
    `[firebase] Incomplete config — using MOCK auth. Missing VITE_FIREBASE_* keys: ${missing.join(", ")}`,
  );
}

const app = hasFirebaseConfig
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

const auth = app ? getAuth(app) : null;

export { app, auth, hasFirebaseConfig };
