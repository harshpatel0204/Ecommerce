import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

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

const RECAPTCHA_CONTAINER_ID = "firebase-recaptcha";
let activeRecaptcha: RecaptchaVerifier | null = null;

// Firebase's invisible reCAPTCHA cannot execute inside a display:none element,
// and a container can only host one widget at a time. So the container lives
// directly on <body> (visible but empty) and any previous widget is cleared
// before a new one is created — otherwise a retry/resend throws
// "reCAPTCHA has already been rendered in this element".
export function createRecaptchaVerifier(): RecaptchaVerifier {
  if (!auth) throw new Error("Firebase is not configured");
  if (activeRecaptcha) {
    try {
      activeRecaptcha.clear();
    } catch {
      // already cleared (e.g. after a completed sign-in)
    }
    activeRecaptcha = null;
  }
  // Always start from a brand-new container element. Clearing the verifier is
  // not enough: Vite HMR resets `activeRecaptcha` while the old grecaptcha
  // widget is still mounted in the DOM, and rendering into a dirty container
  // throws "reCAPTCHA has already been rendered in this element".
  document.getElementById(RECAPTCHA_CONTAINER_ID)?.remove();
  const container = document.createElement("div");
  container.id = RECAPTCHA_CONTAINER_ID;
  document.body.appendChild(container);
  activeRecaptcha = new RecaptchaVerifier(auth, container, { size: "invisible" });
  return activeRecaptcha;
}

// Translate Firebase auth error codes into actionable messages; the raw
// "Firebase: Error (auth/...)" strings don't tell the user what to change.
export function firebaseAuthMessage(err: unknown, fallback: string): string {
  // Backend (Axios) errors carry the real reason in response.data.detail —
  // show that instead of Axios's generic ERR_BAD_REQUEST code.
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === "string" && detail) {
    return detail;
  }
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/operation-not-allowed":
      return "This sign-in method is disabled for the Firebase project. Enable it in Firebase Console → Authentication → Sign-in method.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Firebase sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.";
    case "auth/invalid-app-credential":
      return "reCAPTCHA verification failed — check that this domain is listed under Firebase Authorized domains.";
    case "auth/billing-not-enabled":
      return "Phone sign-in requires the Firebase Blaze plan (or add a test phone number in the Firebase Console).";
    case "auth/too-many-requests":
      return "Too many attempts from this device. Wait a while or use a Firebase test phone number.";
    case "auth/invalid-phone-number":
      return "That phone number is not valid. Use the full number without spaces, e.g. 9876543210.";
    case "auth/invalid-verification-code":
      return "Incorrect OTP code. Please check and try again.";
    case "auth/code-expired":
      return "This OTP has expired. Request a new code.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked by the browser. Allow popups for this site and retry.";
  }
  const message = (err as Error | undefined)?.message;
  return code ? `${fallback} (${code})` : message || fallback;
}

export { app, auth, hasFirebaseConfig };
