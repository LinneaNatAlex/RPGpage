import { applyActionCode, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebaseConfig";

export function emailVerificationAction() {
  if (typeof window === "undefined") return undefined;
  return {
    url: `${window.location.origin}/verify-email`,
    handleCodeInApp: false,
  };
}

export async function sendVerificationEmail(user) {
  if (!user) throw new Error("No user");
  const action = emailVerificationAction();
  try {
    await sendEmailVerification(user, action);
  } catch {
    await sendEmailVerification(user);
  }
}

/** Pull latest emailVerified from Firebase — cached auth state stays stale after the mail link. */
export async function refreshAuthUser() {
  const user = auth.currentUser;
  if (!user) return null;
  await user.reload();
  try {
    await user.getIdToken(true);
  } catch {
    /* ignore */
  }
  return auth.currentUser;
}

/** If this page was opened from the verification link, apply the code. */
export async function consumeEmailVerificationLink() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const code = params.get("oobCode");
  if (mode !== "verifyEmail" || !code) return false;
  await applyActionCode(auth, code);
  if (auth.currentUser) await refreshAuthUser();
  window.history.replaceState({}, document.title, window.location.pathname);
  return true;
}
