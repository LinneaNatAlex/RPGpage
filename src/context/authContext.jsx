import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// BanOverlay: shows ban message and a back arrow to main page
function BanOverlay({ reason, bannedType }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(30,30,40,0.97)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          background: "none",
          border: "none",
          color: "#ffd86b",
          fontSize: 32,
          cursor: "pointer",
        }}
        aria-label="Back to main page"
        title="Back to main page"
      >
        ←
      </button>
      <h1 style={{ color: "#ff6b6b" }}>Account Banned</h1>
      <p style={{ fontSize: 18, marginBottom: 16 }}>
        {reason || "You are banned and cannot access this site."}
      </p>
      <div style={{ fontSize: 15, color: "#ffd86b", marginBottom: 12 }}>
        {bannedType === "ip"
          ? "Your IP address has been permanently banned from this site. If you believe this is a mistake, please contact an administrator."
          : "Your account has been permanently banned from this site. If you believe this is a mistake, please contact an administrator."}
      </div>
    </div>
  );
}
import SuspendedOverlay from "../Components/SuspendedOverlay";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

const authContext = createContext({
  user: null,
  loading: true,
  emailVerified: false,
  refreshAuthState: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [blocked, setBlocked] = useState({
    blocked: false,
    reason: "",
    until: null,
  });

  // Force refresh auth state (e.g. after email verification – reload() alone does not re-fire onAuthStateChanged)
  const refreshAuthState = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    const currentUser = auth.currentUser;
    if (!currentUser.emailVerified) return;
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      let userData = userDoc.exists()
        ? { ...currentUser, ...userDoc.data() }
        : currentUser;
      // Repair: if doc has no profile image, try tempUserData else sync from Auth photoURL
      if (userDoc?.exists()) {
        const data = userDoc.data();
        if (!data.profileImageUrl) {
          try {
            const tempUserData = typeof localStorage !== "undefined" ? localStorage.getItem("tempUserData") : null;
            const parsed = tempUserData ? (() => { try { return JSON.parse(tempUserData); } catch { return null; } })() : null;
            const urlToSave = parsed?.uid === currentUser.uid && parsed?.profileImageUrl
              ? parsed.profileImageUrl
              : currentUser.photoURL || null;
            if (urlToSave) {
              await updateDoc(doc(db, "users", currentUser.uid), { profileImageUrl: urlToSave });
              userData = { ...userData, profileImageUrl: urlToSave };
              if (parsed?.uid === currentUser.uid) localStorage.removeItem("tempUserData");
            }
          } catch (e) {
            // ignore
          }
        }
      }
      setUser(userData);
      setEmailVerified(true);
    } catch (e) {
      setUser(currentUser);
      setEmailVerified(true);
    }
  };

  useEffect(() => {
    // Add focus listener to refresh auth when user returns to tab
    const handleFocus = () => {
      refreshAuthState();
    };

    window.addEventListener("focus", handleFocus);

    const authStart = Date.now();
    const MIN_LOAD_MS = 500; // Min tid loading vises ved reload (unngår blink når auth er cachet)

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const timeoutId = setTimeout(() => {
        console.warn("Auth loading timeout - forcing loading to false");
        setLoading(false);
      }, 10000);

      const setLoadingWhenReady = () => {
        const elapsed = Date.now() - authStart;
        const delay = Math.max(0, MIN_LOAD_MS - elapsed);
        if (delay > 0) setTimeout(() => setLoading(false), delay);
        else setLoading(false);
      };

      try {
        if (currentUser) {
          // Get user data from Firestore with retry logic
          let userDoc;
          let retries = 2; // Reduce retries to prevent long loading times
          while (retries > 0) {
            try {
              const userDocRef = doc(db, "users", currentUser.uid);
              userDoc = await getDoc(userDocRef);
              break;
            } catch (firestoreError) {
              console.warn(`Firestore error (${3 - retries}):`, firestoreError);
              retries--;
              if (retries === 0) {
                console.error("Failed to fetch user data after 2 attempts");
                // Set user anyway with basic data to prevent infinite loading
                setUser(currentUser);
                setEmailVerified(currentUser.emailVerified);
                setBlocked({
                  blocked: false,
                  reason: "",
                  until: null,
                  bannedType: null,
                });
                return;
              }
              // Reduce wait time between retries
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }

          let userData = currentUser;
          if (userDoc && userDoc.exists()) {
            const data = userDoc.data();
            userData = { ...currentUser, ...data };
            // Repair: if doc has no profile image, try tempUserData from registration, else sync from Auth photoURL
            if (!data.profileImageUrl && currentUser.emailVerified) {
              try {
                const tempUserData = typeof localStorage !== "undefined" ? localStorage.getItem("tempUserData") : null;
                const parsed = tempUserData ? (() => { try { return JSON.parse(tempUserData); } catch { return null; } })() : null;
                const urlToSave = parsed?.uid === currentUser.uid && parsed?.profileImageUrl
                  ? parsed.profileImageUrl
                  : currentUser.photoURL || null;
                if (urlToSave) {
                  await updateDoc(doc(db, "users", currentUser.uid), { profileImageUrl: urlToSave });
                  userData = { ...userData, profileImageUrl: urlToSave };
                  if (parsed?.uid === currentUser.uid) localStorage.removeItem("tempUserData");
                }
              } catch (e) {
                // ignore repair errors
              }
            }
            setUser(userData);
          } else {
            // If user document doesn't exist but email is verified,
            // use tempUserData from registration (includes profileImageUrl) if present, else create basic user document
            if (currentUser.emailVerified) {
              try {
                const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
                const tempUserData = typeof localStorage !== "undefined" ? localStorage.getItem("tempUserData") : null;
                const parsedTemp = tempUserData ? (() => { try { return JSON.parse(tempUserData); } catch { return null; } })() : null;
                const isTempForThisUser = parsedTemp && parsedTemp.uid === currentUser.uid;

                const dataToSave = isTempForThisUser
                  ? {
                      ...parsedTemp,
                      uid: currentUser.uid,
                      createdAt: new Date(),
                      lastLogin: new Date(),
                      online: true,
                    }
                  : (() => {
                      const now = Date.now();
                      return {
                        uid: currentUser.uid,
                        displayName: currentUser.displayName || currentUser.email,
                        email: currentUser.email,
                        roles: ["user"],
                        race: "Wizard",
                        class: "1st year",
                        currency: 1000,
                        inventory: [],
                        createdAt: new Date(),
                        lastLogin: new Date(),
                        online: true,
                        vipExpiresAt: now + oneMonthMs,
                        lastSeenNewsAt: now, // Only show news published after registration
                      };
                    })()

                await setDoc(doc(db, "users", currentUser.uid), dataToSave);
                if (isTempForThisUser) localStorage.removeItem("tempUserData");
                setUser({ ...currentUser, ...dataToSave });
              } catch (error) {
                console.error("Failed to create user document:", error);
                // Set user anyway with basic Firebase auth data
                setUser(currentUser);
              }
            } else {
              // Email not verified, don't set user
              setUser(null);
              setEmailVerified(false);
              setBlocked({
                blocked: false,
                reason: "",
                until: null,
                bannedType: null,
              });
              return;
            }
          }

          setEmailVerified(currentUser.emailVerified);

          // SUSPENSION/BAN/IP-BAN CHECK
          let blocked = false;
          let reason = "";
          let until = null;
          let description = "";
          let bannedType = null;
          const now = Date.now();
          if (userData.bannedIp) {
            blocked = true;
            reason = "Your IP address is permanently banned.";
            bannedType = "ip";
          } else if (userData.banned) {
            blocked = true;
            reason = "Your account is permanently banned.";
            bannedType = "account";
          } else if (
            false &&
            userData.pausedUntil &&
            userData.pausedUntil > now
          ) {
            // TEMPORARILY DISABLED - suspend check
            blocked = true;
            reason = "Your account is temporarily suspended.";
            until = userData.pausedUntil;
            description = userData.suspendReason || "";
          }
          setBlocked({ blocked, reason, until, description, bannedType });

          // Online/lastLogin skrives ikke her – kun når bruker åpner online-popup (TopBar)
        } else {
          setUser(null);
          setEmailVerified(false);
          setBlocked({
            blocked: false,
            reason: "",
            until: null,
            bannedType: null,
          });
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        clearTimeout(timeoutId);
        setLoadingWhenReady();
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <authContext.Provider
      value={{ user, loading, emailVerified, refreshAuthState }}
    >
      {/* TEMPORARILY DISABLED - ALL BLOCKING LOGIC 
      {blocked.blocked ? (
        blocked.bannedType ? (
          <BanOverlay reason={blocked.reason} bannedType={blocked.bannedType} />
        ) : (
          <SuspendedOverlay
            until={blocked.until}
            reason={blocked.reason}
            description={blocked.description}
          />
        )
      ) : (
        children
      )}
      */}
      {children}
    </authContext.Provider>
  );
};

// Calling useAuth will return the value of the context later in the app
export const useAuth = () => useContext(authContext);
