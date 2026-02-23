// Polling instead of onSnapshot to reduce Firestore reads (one batch per 60s per client)
import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

const POLL_INTERVAL_MS = 60 * 1000; // 60 seconds

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
          .filter((u) => !u.invisibleUntil || u.invisibleUntil < now);
        setOnlineUsers(users);
      } catch (err) {
        if (process.env.NODE_ENV === "development")
          console.warn("useOnlineUsers fetch error:", err);
      }
    };

    fetchOnline();
    const interval = setInterval(fetchOnline, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return onlineUsers;
};
export default useOnlineUsers;
