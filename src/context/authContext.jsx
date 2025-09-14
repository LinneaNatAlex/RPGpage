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
import { doc, setDoc, getDoc } from "firebase/firestore";

const authContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [blocked, setBlocked] = useState({
    blocked: false,
    reason: "",
    until: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Get user data from Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          let userData = currentUser;
          if (userDoc.exists()) {
            userData = { ...currentUser, ...userDoc.data() };
            setUser(userData);
          } else {
            setUser(currentUser);
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
          } else if (userData.pausedUntil && userData.pausedUntil > now) {
            blocked = true;
            reason = "Your account is temporarily suspended.";
            until = userData.pausedUntil;
            description = userData.suspendReason || "";
          }
          setBlocked({ blocked, reason, until, description, bannedType });

          // Update online status
          await setDoc(
            doc(db, "users", currentUser.uid),
            {
              displayName: currentUser.displayName || currentUser.email,
              online: true,
            },
            { merge: true }
          );

          // Handle offline status
          const handleUnload = async () => {
            await setDoc(
              doc(db, "users", currentUser.uid),
              {
                online: false,
              },
              { merge: true }
            );
          };
          window.addEventListener("beforeunload", handleUnload);
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
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <authContext.Provider value={{ user, loading, emailVerified }}>
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
    </authContext.Provider>
  );
};

// Calling useAuth will return the value of the context later in the app
export const useAuth = () => useContext(authContext);
