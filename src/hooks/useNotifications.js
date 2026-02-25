import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import { cacheHelpers } from "../utils/firebaseCache";

/**
 * Hook for notifications + recent news (unseen).
 * Used by TopBar and MobileLayout.
 * @param {{ uid: string } | null} user - current auth user
 * @param {{ lastSeenNewsAt?: number } | null} userData - user doc (for lastSeenNewsAt)
 */
export default function useNotifications(user, userData) {
  const [notifications, setNotifications] = useState([]);
  const [recentNews, setRecentNews] = useState([]);

  const NOTIF_POLL_MS = 3 * 60 * 1000; // 3 min, kun når fanen er synlig
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }
    const notifRef = collection(db, "notifications");
    const q = query(
      notifRef,
      where("to", "==", user.uid),
      limit(80)
    );
    const applySnapshot = (snap) => {
      const byTo = (snap.docs || []).map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          _sort: data.created ?? data.createdAt?.toMillis?.() ?? 0,
        };
      });
      byTo.sort((a, b) => (b._sort || 0) - (a._sort || 0));
      const list = byTo.slice(0, 50).map(({ _sort, ...n }) => n);
      setNotifications(list);
      cacheHelpers.setNotifications(user.uid, list.filter((n) => !n.read));
    };
    const fetchNotifs = () => {
      getDocs(q)
        .then(applySnapshot)
        .catch((err) => {
          console.error("Notifications fetch error:", err);
          setNotifications([]);
        });
    };
    let interval = null;
    const runWhenVisible = () => {
      if (typeof document === "undefined" || document.visibilityState !== "visible") return;
      fetchNotifs();
      interval = setInterval(fetchNotifs, NOTIF_POLL_MS);
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
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !userData) {
      setRecentNews([]);
      return;
    }
    const lastSeen = userData.lastSeenNewsAt ?? 0;
    const q = query(
      collection(db, "news"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    getDocs(q)
      .then((snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => item.type === "nyhet")
          .filter((item) => {
            const t = item.createdAt?.toMillis?.() ?? item.createdAt ?? 0;
            return t > lastSeen;
          });
        setRecentNews(list);
      })
      .catch(() => setRecentNews([]));
  }, [user?.uid, userData?.lastSeenNewsAt]);

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      await Promise.all(
        unread.map((n) =>
          updateDoc(doc(db, "notifications", n.id), { read: true })
        )
      );
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      cacheHelpers.setNotifications(user.uid, []);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const unreadCount =
    notifications.filter((n) => !n.read).length + recentNews.length;

  return {
    notifications,
    recentNews,
    markAllAsRead,
    unreadCount,
  };
}
