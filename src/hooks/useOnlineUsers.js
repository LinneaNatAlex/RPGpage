// Polling only when tab is visible; 15 min interval – sparer reads når bruker ikke er aktiv
import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutter

const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("online", "==", true),
        );
        const snapshot = await getDocs(q);
        const now = Date.now();
        const users = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return { ...data, id: docSnap.id };
          })
          .filter((u) => !u.invisibleUntil || u.invisibleUntil < now)
          .filter((u) => {
            const name = (u.displayName && String(u.displayName).trim()) || "";
            const email = (u.email && String(u.email).trim()) || "";
            return name.length > 0 || email.length > 0;
          });
        setOnlineUsers(users);
      } catch (err) {
        if (process.env.NODE_ENV === "development")
          console.warn("useOnlineUsers fetch error:", err);
      }
    };

    let interval = null;
    const runWhenVisible = () => {
      if (typeof document === "undefined" || document.visibilityState !== "visible") return;
      fetchOnline();
      interval = setInterval(fetchOnline, POLL_INTERVAL_MS);
    };

    runWhenVisible();
    const onVisibility = () => {
      if (interval) clearInterval(interval);
      interval = null;
      if (document.visibilityState === "visible") runWhenVisible();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (interval) clearInterval(interval);
    };
  }, []);

  return onlineUsers;
};
export default useOnlineUsers;
