// src/Components/TopBar/TopBar.jsx

import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import GiftModal from "./GiftModal";
import SegmentSchedulePopup from "../SegmentSchedulePopup/SegmentSchedulePopup";
import useUsers from "../../hooks/useUser";
import useUserData from "../../hooks/useUserData";
import useUserRoles from "../../hooks/useUserRoles";
import { cacheHelpers } from "../../utils/firebaseCache";
import { useOpenPrivateChat } from "../../context/openPrivateChatContext";
import { useOnlineListContext } from "../../context/onlineListContext";
import OnlineUsers from "../OnlineUsers/OnlineUsers";

import styles from "./TopBar.module.css";
import { forumNames } from "../../data/forumList";

// Map forum display name → id (e.g. "18+ Forum" → "18plus") for followed topics that lack forumRoom
const forumDisplayToId = Object.fromEntries(
  Object.entries(forumNames).map(([id, name]) => [name, id])
);

// Helper function to update user doc and clear cache
const updateUserDocWithCacheClear = async (userRef, updates, userId) => {
  await updateDoc(userRef, updates);
  cacheHelpers.clearUserCache(userId);
};

// Forum path for URLs: "short,butlong" -> "shortbutlong" (must match Forum.jsx)
const normalizeForumPath = (path) => {
  if (!path || typeof path !== "string") return path || "general";
  const p = path.toLowerCase().replace(/\s+/g, "");
  return p === "short,butlong" ? "shortbutlong" : p;
};

function HealthBar({ health = 100, maxHealth = 100 }) {
  const percent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  return (
    <div className={styles.healthBarWrapper}>
      <div className={styles.healthBarOuter}>
        <div
          className={styles.healthBarInner}
          style={{ width: percent + "%" }}
        />
      </div>
      <span className={styles.healthText}>
        {health} / {maxHealth}
      </span>
    </div>
  );
}

const TopBar = () => {
  const { user } = useAuth();
  const { userData, loading: userDataLoading } = useUserData();
  const { roles } = useUserRoles();
  const navigate = useNavigate();
  const { setOpenWithUid, setOpenWithGroupId } = useOpenPrivateChat();
  const [infirmary, setInfirmary] = useState(false);
  const isAdmin = roles?.some((r) => String(r).toLowerCase() === "admin");
  const [detentionUntil, setDetentionUntil] = useState(null);
  const [infirmaryEnd, setInfirmaryEnd] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [invisibleUntil, setInvisibleUntil] = useState(null);
  const [invisibleCountdown, setInvisibleCountdown] = useState(0);
  const [giftModal, setGiftModal] = useState({ open: false, item: null });
  const [notifications, setNotifications] = useState([]);
  const [recentNews, setRecentNews] = useState([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const notificationsPanelRef = useRef(null);
  const [inLoveWith, setInLoveWith] = useState(null);
  const [inLoveUntil, setInLoveUntil] = useState(null);
  const [inLoveCountdown, setInLoveCountdown] = useState(0);
  const [showFollowedTopics, setShowFollowedTopics] = useState(false);
  const [followedTopics, setFollowedTopics] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const topicsPerPage = 10;
  const { requestOpen } = useOnlineListContext();
  const [showOnlinePanel, setShowOnlinePanel] = useState(false);
  const onlinePanelRef = useRef(null);

  // Fetch user's followed topics
  const fetchFollowedTopics = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const topics = userData.followedTopics || [];
        setFollowedTopics(topics);
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchFollowedTopics();
  }, [user]);

  // Pagination logic
  const totalPages = Math.ceil(followedTopics.length / topicsPerPage);
  const startIndex = (currentPage - 1) * topicsPerPage;
  const endIndex = startIndex + topicsPerPage;
  const currentTopics = followedTopics.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Use followedTopics from useUserData (single source; avoids extra onSnapshot read)
  useEffect(() => {
    if (!user) {
      setFollowedTopics([]);
      return;
    }
    const list = userData?.followedTopics ?? [];
    setFollowedTopics(Array.isArray(list) ? list : []);
  }, [user, userData?.followedTopics]);

  // Poll for new posts in followed topics (avoids N snapshot listeners per user)
  const followedTopicsPollRef = useRef(Date.now());
  useEffect(() => {
    if (!user || followedTopics.length === 0) return;

    const POLL_MS = 2 * 60 * 1000; // 2 minutes

    const poll = async () => {
      const now = Date.now();
      const lastPoll = followedTopicsPollRef.current;
      followedTopicsPollRef.current = now;

      for (const topic of followedTopics) {
        try {
          // Use forumRoom (e.g. "18plus"); fallback: display name → id so "18+ Forum" → "18plus"
          const roomId =
            (topic.forumRoom && String(topic.forumRoom).trim()) ||
            forumDisplayToId[String(topic.forum || "").trim()] ||
            String(topic.forum || "").toLowerCase().replace(/\s+/g, "");
          const postsRef = collection(
            db,
            `forums/${roomId}/topics/${topic.id}/posts`,
          );
          const q = query(
            postsRef,
            orderBy("createdAt", "desc"),
            limit(1),
          );
          const snap = await getDocs(q);
          const doc = snap.docs[0];
          if (!doc) continue;
          const post = doc.data();
          const postTime =
            post.createdAt?.toMillis?.() ??
            (post.createdAt && typeof post.createdAt.toDate === "function"
              ? post.createdAt.toDate().getTime()
              : 0);
          if (
            postTime > lastPoll &&
            post.uid !== user.uid
          ) {
            await addDoc(collection(db, "notifications"), {
              to: user.uid,
              type: "topic_reply",
              topicId: topic.id,
              topicTitle: topic.title,
              forum: topic.forum,
              author: post.author,
              content: post.content,
              createdAt: serverTimestamp(),
              created: Date.now(),
              read: false,
            });
          }
        } catch (e) {
          if (process.env.NODE_ENV === "development")
            console.warn("TopBar followed topics poll error:", e);
        }
      }
    };

    const t = setInterval(poll, POLL_MS);
    poll(); // run once soon after mount (uses current lastPoll so no stale notifications)
    return () => clearInterval(t);
  }, [user, followedTopics]);

  // New potion effect states
  const [hairColorUntil, setHairColorUntil] = useState(null);
  const [rainbowUntil, setRainbowUntil] = useState(null);
  const [glowUntil, setGlowUntil] = useState(null);
  const [sparkleUntil, setSparkleUntil] = useState(null);
  const [translationUntil, setTranslationUntil] = useState(null);
  const [echoUntil, setEchoUntil] = useState(null);
  const [whisperUntil, setWhisperUntil] = useState(null);
  const [shoutUntil, setShoutUntil] = useState(null);
  const [darkModeUntil, setDarkModeUntil] = useState(null);
  const [retroUntil, setRetroUntil] = useState(null);
  const [mirrorUntil, setMirrorUntil] = useState(null);
  const [speedUntil, setSpeedUntil] = useState(null);
  const [slowMotionUntil, setSlowMotionUntil] = useState(null);
  const [surveillanceUntil, setSurveillanceUntil] = useState(null);
  const [luckyUntil, setLuckyUntil] = useState(null);
  const [wisdomUntil, setWisdomUntil] = useState(null);
  const [charmUntil, setCharmUntil] = useState(null);
  const [mysteryUntil, setMysteryUntil] = useState(null);
  const intervalRef = useRef();
  const { users } = useUsers();

  // Update local state when userData changes
  useEffect(() => {
    if (!userData || userDataLoading) return;

    // Update potion effects
    setHairColorUntil(
      userData.hairColorUntil && userData.hairColorUntil > Date.now()
        ? userData.hairColorUntil
        : null,
    );
    setRainbowUntil(
      userData.rainbowUntil && userData.rainbowUntil > Date.now()
        ? userData.rainbowUntil
        : null,
    );
    setGlowUntil(
      userData.glowUntil && userData.glowUntil > Date.now()
        ? userData.glowUntil
        : null,
    );
    setSparkleUntil(
      userData.sparkleUntil && userData.sparkleUntil > Date.now()
        ? userData.sparkleUntil
        : null,
    );
    setTranslationUntil(
      userData.translationUntil && userData.translationUntil > Date.now()
        ? userData.translationUntil
        : null,
    );
    setEchoUntil(
      userData.echoUntil && userData.echoUntil > Date.now()
        ? userData.echoUntil
        : null,
    );
    setWhisperUntil(
      userData.whisperUntil && userData.whisperUntil > Date.now()
        ? userData.whisperUntil
        : null,
    );
    setShoutUntil(
      userData.shoutUntil && userData.shoutUntil > Date.now()
        ? userData.shoutUntil
        : null,
    );
    setDarkModeUntil(
      userData.darkModeUntil && userData.darkModeUntil > Date.now()
        ? userData.darkModeUntil
        : null,
    );
    setRetroUntil(
      userData.retroUntil && userData.retroUntil > Date.now()
        ? userData.retroUntil
        : null,
    );
    setMirrorUntil(
      userData.mirrorUntil && userData.mirrorUntil > Date.now()
        ? userData.mirrorUntil
        : null,
    );
    setSpeedUntil(
      userData.speedUntil && userData.speedUntil > Date.now()
        ? userData.speedUntil
        : null,
    );
    setSlowMotionUntil(
      userData.slowMotionUntil && userData.slowMotionUntil > Date.now()
        ? userData.slowMotionUntil
        : null,
    );
    setSurveillanceUntil(
      userData.surveillanceUntil && userData.surveillanceUntil > Date.now()
        ? userData.surveillanceUntil
        : null,
    );
    setLuckyUntil(
      userData.luckyUntil && userData.luckyUntil > Date.now()
        ? userData.luckyUntil
        : null,
    );
    setWisdomUntil(
      userData.wisdomUntil && userData.wisdomUntil > Date.now()
        ? userData.wisdomUntil
        : null,
    );
    setCharmUntil(
      userData.charmUntil && userData.charmUntil > Date.now()
        ? userData.charmUntil
        : null,
    );
    setMysteryUntil(
      userData.mysteryUntil && userData.mysteryUntil > Date.now()
        ? userData.mysteryUntil
        : null,
    );

    // Love Potion effect
    if (userData.inLoveUntil && userData.inLoveUntil > Date.now()) {
      setInLoveWith(userData.inLoveWith || "Someone");
      setInLoveUntil(userData.inLoveUntil);
    } else {
      setInLoveWith(null);
      setInLoveUntil(null);
    }

    // Infirmary state - check if infirmaryEnd exists and hasn't expired
    if (userData.infirmaryEnd && userData.infirmaryEnd > Date.now()) {
      setInfirmary(true);
      setInfirmaryEnd(userData.infirmaryEnd);
    } else {
      setInfirmary(false);
      setInfirmaryEnd(null);
    }

    // Detention state
    if (userData.detentionUntil && Date.now() < userData.detentionUntil) {
      setDetentionUntil(userData.detentionUntil);
    } else {
      setDetentionUntil(null);
    }
    if (userData.invisibleUntil && Date.now() < userData.invisibleUntil) {
      setInvisibleUntil(userData.invisibleUntil);
    } else {
      setInvisibleUntil(null);
    }
  }, [userData]);

  // Love Potion countdown
  useEffect(() => {
    if (!inLoveUntil || inLoveUntil < Date.now()) {
      setInLoveCountdown(0);
      return;
    }
    const updateCountdown = () => {
      const secs = Math.max(0, Math.floor((inLoveUntil - Date.now()) / 1000));
      setInLoveCountdown(secs);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [inLoveUntil]);

  // Health decay som fungerer offline/online
  useEffect(() => {
    if (!user) return;
    const msPerHp = (3 * 24 * 60 * 60 * 1000) / 100; // 3 dager fra 100 til 0 HP
    const healthPerDecay = 1;
    const userRef = doc(db, "users", user.uid);

    async function decayHealth() {
      try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) return;
        const data = userDoc.data();

        // CRITICAL FIX: Don't decay health if user is in infirmary
        if (data.infirmaryEnd && data.infirmaryEnd > Date.now()) {
          // User is in infirmary, just update lastHealthUpdate to prevent catching up when they get out
          await updateDoc(userRef, { lastHealthUpdate: Date.now() });
          return;
        }

        // If infirmaryEnd has expired, recover the user
        if (data.infirmaryEnd && data.infirmaryEnd <= Date.now()) {
          await updateDoc(userRef, {
            health: 100,
            infirmaryEnd: null,
            lastHealthUpdate: Date.now(),
          });
          return;
        }

        // Finn hvor lenge siden sist decay
        const now = Date.now();
        let lastUpdate = data.lastHealthUpdate || now;
        let health = data.health ?? 100;
        const elapsed = now - lastUpdate;
        const hpToLose = Math.floor(elapsed / msPerHp);
        if (hpToLose > 0) {
          let newHealth = health - hpToLose * healthPerDecay;
          let update = { lastHealthUpdate: now };
          if (newHealth <= 0) {
            newHealth = 0;
            update.health = 0;
            // Set infirmaryEnd to 20 minutes from now
            update.infirmaryEnd = Date.now() + 20 * 60 * 1000;
          } else {
            update.health = newHealth;
          }
          await updateDoc(userRef, update);
        } else if (!data.lastHealthUpdate) {
          // Sett første gang
          await updateDoc(userRef, { lastHealthUpdate: now });
        }
      } catch (error) {}
    }

    decayHealth();
    intervalRef.current = setInterval(decayHealth, msPerHp);
    return () => clearInterval(intervalRef.current);
  }, [user, infirmary]);

  // Infirmary countdown
  useEffect(() => {
    if (!infirmary || !infirmaryEnd) return;
    setCountdown(Math.max(0, Math.floor((infirmaryEnd - Date.now()) / 1000)));
    const timer = setInterval(() => {
      try {
        const secs = Math.max(
          0,
          Math.floor((infirmaryEnd - Date.now()) / 1000),
        );
        setCountdown(secs);
        if (secs <= 0) {
          // Ferdig, gjenopprett health
          if (user) {
            const userRef = doc(db, "users", user.uid);
            updateDoc(userRef, {
              health: 100,
              infirmaryEnd: null,
              lastHealthUpdate: Date.now(), // Prevent immediate health decay after recovery
            });
          }
          setInfirmary(false);
          setInfirmaryEnd(null);
        }
      } catch (error) {}
    }, 1000);
    return () => clearInterval(timer);
  }, [infirmary, infirmaryEnd, user]);

  // Invisibility countdown
  useEffect(() => {
    if (!invisibleUntil) {
      setInvisibleCountdown(0);
      return;
    }
    const updateCountdown = () => {
      const secs = Math.max(
        0,
        Math.floor((invisibleUntil - Date.now()) / 1000),
      );
      setInvisibleCountdown(secs);
      if (secs <= 0) setInvisibleUntil(null);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [invisibleUntil]);

  // Notifications: real-time listener so badge and list update when new notifications arrive
  const fetchNotifications = useRef(null);
  useEffect(() => {
    if (!user) return;

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

    const fetch = () => {
      getDocs(q)
        .then(applySnapshot)
        .catch((e) => {
          console.error("Notifications fetch error:", e);
          setNotifications([]);
        });
    };

    fetchNotifications.current = fetch;
    let interval = null;
    const runWhenVisible = () => {
      if (typeof document === "undefined" || document.visibilityState !== "visible") return;
      fetch();
      interval = setInterval(fetch, 3 * 60 * 1000);
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
  }, [user]);

  // Recent news for notification list (newer than lastSeenNewsAt)
  useEffect(() => {
    if (!user || !userData) return;
    const lastSeen = userData.lastSeenNewsAt ?? 0;
    const q = query(
      collection(db, "news"),
      orderBy("createdAt", "desc"),
      limit(10),
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
  }, [user, userData?.lastSeenNewsAt]);

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (!user) return;
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

  // Close notifications panel on Escape
  useEffect(() => {
    if (!showNotificationsPanel) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowNotificationsPanel(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showNotificationsPanel]);

  const closeOnlinePanel = async () => {
    if (user?.uid) {
      try {
        await setDoc(doc(db, "users", user.uid), { online: false }, { merge: true });
      } catch (e) {
        if (process.env.NODE_ENV === "development") console.warn("Online status write:", e);
      }
    }
    setShowOnlinePanel(false);
    requestOpen("topbar", false);
  };

  // Lukk online-panel ved Escape; oppdater context når panel lukkes
  useEffect(() => {
    if (!showOnlinePanel) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeOnlinePanel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showOnlinePanel]);
  useEffect(() => {
    return () => requestOpen("topbar", false);
  }, [requestOpen]);

  return (
    <>
      {/* Fainted overlay – admin kan alltid bruke menyen og gå til Admin Panel */}
      {infirmary && !isAdmin && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(20,20,30,0.85)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#ff6b6b",
            fontWeight: 700,
            fontSize: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              zIndex: 10001,
            }}
          >
            You are fainted!
            <br />
            You cannot use the menu or inventory.
            <br />
            Time left: {String(Math.floor(countdown / 60)).padStart(2, "0")}:
            {String(countdown % 60).padStart(2, "0")}
          </div>
          {/* Chatten må ha id="chat" eller lignende for å slippe gjennom overlayen */}
          <style>{`
            #chat, #chat * {
              pointer-events: auto !important;
              z-index: 10002 !important;
            }
          `}</style>
        </div>
      )}

      {/* Love Potion: falling hearts */}
      {inLoveUntil && inLoveUntil > Date.now() && (
        <div
          style={{
            pointerEvents: "none",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: -10,
            overflow: "hidden",
          }}
        >
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${Math.random() * 100}vw`,
                top: `-${Math.random() * 20}vh`,
                fontSize: `${Math.random() * 1.5 + 1}rem`,
                color: "#ff69b4",
                opacity: 0.4,
                animation: `heartFall 10s linear infinite`,
                animationDelay: `${Math.random() * 10}s`,
              }}
            >
              ❤️
            </span>
          ))}
          <style>{`
            @keyframes heartFall {
              0% { transform: translateY(0); opacity: 0.4; }
              90% { opacity: 0.4; }
              100% { transform: translateY(120vh); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <div
        className={styles.topBar}
        style={{
          ...(infirmary ? { opacity: 0.5, filter: "grayscale(1)" } : {}),
          ...(inLoveUntil && inLoveUntil > Date.now()
            ? {
                backgroundColor: "#ff69b4",
                color: "#ffffff",
                boxShadow: "0 0 16px 6px #ff69b4, 0 0 32px 12px #ffb6d5 inset",
              }
            : {}),
        }}
      >
        {/* Love Potion CSS for all elements */}
        {inLoveUntil && inLoveUntil > Date.now() && (
          <style>{`
            .${styles.topBar} {
              background: linear-gradient(135deg, #ff69b4 0%, #ffb6d5 100%) !important;
            }
            .${styles.topBar} * {
              background-color: rgba(255, 255, 255, 0.15) !important;
              color: #ffffff !important;
            }
            .${styles.topBar} button {
              background-color: rgba(255, 255, 255, 0.2) !important;
              color: #ffffff !important;
              border: 1px solid rgba(255, 255, 255, 0.3) !important;
              backdrop-filter: blur(10px);
            }
            .${styles.topBar} button:hover {
              background-color: rgba(255, 255, 255, 0.3) !important;
            }
            .${styles.topBar} div[style*="background"] {
              background-color: rgba(255, 255, 255, 0.15) !important;
            }
            .${styles.topBar} span {
              background-color: rgba(255, 255, 255, 0.15) !important;
            }
          `}</style>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <SegmentSchedulePopup />
          {(() => {
            if (!user) return null;
            const src =
              user.photoURL || userData?.profileImageUrl || "/icons/avatar.svg";
            // Compute role-based class
            let roleClass = styles.profilePic;
            const lower = (userData?.roles || []).map((r) =>
              String(r).toLowerCase(),
            );
            if (lower.includes("headmaster"))
              roleClass += ` ${styles.headmasterPic}`;
            else if (lower.includes("professor") || lower.includes("teacher"))
              roleClass += ` ${styles.professorPic}`;
            else if (lower.includes("shadowpatrol"))
              roleClass += ` ${styles.shadowPatrolPic}`;
            else if (lower.includes("admin"))
              roleClass += ` ${styles.adminPic}`;
            return (
              <img
                src={src}
                alt="Profile"
                className={`${roleClass} ${
                  sparkleUntil && sparkleUntil > Date.now()
                    ? "sparkle-effect"
                    : ""
                }`}
                style={
                  inLoveUntil && inLoveUntil > Date.now()
                    ? {
                        boxShadow:
                          "0 0 16px 6px #ff69b4, 0 0 32px 12px #ffb6d5 inset",
                        borderRadius: "50%",
                      }
                    : {}
                }
              />
            );
          })()}
          <HealthBar health={userData?.health || 100} maxHealth={100} />
        </div>
        <div className={styles.currency}>
          <img
            src="/icons/gold-coin.svg"
            alt="Nits"
            className={styles.coinIcon}
          />
          {userData?.currency || 1000} Nits
          <span style={{ marginLeft: 16, color: "#4fc3f7", fontWeight: 700 }}>
            ◆ {userData?.points || 0} points
          </span>
          {invisibleUntil && (
            <span style={{ marginLeft: 16, color: "#00e6a8", fontWeight: 700 }}>
              Invisible:{" "}
              {String(Math.floor(invisibleCountdown / 60)).padStart(2, "0")}:
              {String(invisibleCountdown % 60).padStart(2, "0")}
            </span>
          )}
          {detentionUntil && (
            <span style={{ marginLeft: 16, color: "#ff6b6b", fontWeight: 700 }}>
              ⏰ Detention:{" "}
              {String(
                Math.floor((detentionUntil - Date.now()) / (1000 * 60 * 60)),
              ).padStart(2, "0")}
              :
              {String(
                Math.floor(
                  ((detentionUntil - Date.now()) % (1000 * 60 * 60)) /
                    (1000 * 60),
                ),
              ).padStart(2, "0")}
              :
              {String(
                Math.floor(
                  ((detentionUntil - Date.now()) % (1000 * 60)) / 1000,
                ),
              ).padStart(2, "0")}
            </span>
          )}
        </div>
        <button
          className={`${styles.inventoryIconBtn} ${styles.hideOnMobile}`}
          onClick={() => navigate("/inventory")}
          title="Inventory"
          disabled={infirmary}
        >
          <img
            src="/icons/magic-school.svg"
            alt="Inventory"
            className={styles.chestIcon}
          />
        </button>
        {/* Notifications button + panel */}
        {user && (
          <div
            className={styles.notificationBellWrap}
            ref={notificationsPanelRef}
          >
            <button
              type="button"
              className={styles.inventoryIconBtn}
              onClick={() => {
                setShowNotificationsPanel((v) => {
                  if (!v) fetchNotifications.current?.(); // refresh when opening panel (no polling)
                  return !v;
                });
              }}
              title="Notifications"
              aria-label="Notifications"
              style={{ position: "relative" }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              {(() => {
                const unread =
                  notifications.filter((n) => !n.read).length +
                  recentNews.length;
                if (unread === 0) return null;
                return (
                  <span className={styles.notificationBadge}>
                    {unread > 99 ? "99+" : unread}
                  </span>
                );
              })()}
            </button>
            {showNotificationsPanel && (
              <div className={styles.notificationPanel}>
                <div className={styles.notificationPanelHeader}>
                  <h3>Notifications</h3>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {notifications.filter((n) => !n.read).length > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        style={{
                          fontSize: "0.85rem",
                          padding: "4px 10px",
                          background: "rgba(123, 104, 87, 0.3)",
                          color: "#D4C4A8",
                          border: "1px solid rgba(212, 196, 168, 0.3)",
                          borderRadius: 0,
                          cursor: "pointer",
                        }}
                        aria-label="Mark all as read"
                        title="Mark all as read"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.closeButton}
                      onClick={() => setShowNotificationsPanel(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className={styles.notificationList}>
                  {recentNews.length > 0 &&
                    recentNews.map((news) => (
                      <div
                        key={`news-${news.id}`}
                        className={styles.notificationItem}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          if (
                            e.target.closest(`.${styles.notificationRemoveBtn}`)
                          )
                            return;
                          navigate("/news");
                          setShowNotificationsPanel(false);
                          const seenAt =
                            news.createdAt?.toMillis?.() ??
                            news.createdAt ??
                            Date.now();
                          updateDoc(doc(db, "users", user.uid), {
                            lastSeenNewsAt:
                              typeof seenAt === "number" ? seenAt : Date.now(),
                          });
                          cacheHelpers.clearUserCache(user.uid);
                          setRecentNews((prev) =>
                            prev.filter((n) => n.id !== news.id),
                          );
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && e.currentTarget.click()
                        }
                      >
                        <span className={styles.notificationIconNews}>📰</span>
                        <span className={styles.notificationText}>
                          New news: {news.title || "Untitled"}
                        </span>
                        <button
                          type="button"
                          className={styles.notificationRemoveBtn}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const seenAt =
                              news.createdAt?.toMillis?.() ??
                              news.createdAt ??
                              Date.now();
                            try {
                              await updateDoc(doc(db, "users", user.uid), {
                                lastSeenNewsAt:
                                  typeof seenAt === "number"
                                    ? seenAt
                                    : Date.now(),
                              });
                              cacheHelpers.clearUserCache(user.uid);
                              setRecentNews((prev) =>
                                prev.filter((n) => n.id !== news.id),
                              );
                            } catch (err) {}
                          }}
                          title="Dismiss"
                          aria-label="Dismiss"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  {(() => {
                    const unread = notifications.filter((n) => !n.read);
                    // Group by type + sender/conversation (same type + same from = one row with count)
                    const groupKey = (n) => {
                      const isChat = n.type === "private_chat";
                      const isReply =
                        n.type === "topic_reply" || n.type === "new_topic";
                      if (isChat)
                        return `private_chat:${n.fromUid || n.from || ""}`;
                      if (isReply)
                        return `reply:${n.topicId || ""}:${n.forum || n.forumRoom || ""}`;
                      if (n.type === "profile_like")
                        return `profile_like:${n.fromUid || n.from || ""}`;
                      if (n.type === "content_like")
                        return `content_like:${n.targetType || ""}:${n.targetId || ""}`;
                      if (n.type === "gift")
                        return `gift:${n.fromUid || n.from || ""}:${n.item || ""}`;
                      if (n.type === "group_chat" || n.type === "group_chat_added")
                        return `group_chat:${String(n.groupId || "")}`;
                      return `other:${n.id}`;
                    };
                    const groups = [];
                    unread.forEach((n) => {
                      const key = groupKey(n);
                      const existing = groups.find((g) => g.key === key);
                      if (existing) {
                        existing.items.push(n);
                      } else {
                        groups.push({ key, items: [n] });
                      }
                    });
                    return groups.map((group) => {
                      const n = group.items[0];
                      const count = group.items.length;
                      const isReply =
                        n.type === "topic_reply" || n.type === "new_topic";
                      const isGift = n.type === "gift";
                      const isChat = n.type === "private_chat";
                      const isGroupChat = n.type === "group_chat" || n.type === "group_chat_added";
                      const isLike = n.type === "content_like";
                      const isProfileLike = n.type === "profile_like";
                      const uid = n.fromUid || n.from;
                      const looksLikeUid =
                        typeof n.from === "string" &&
                        n.from.length >= 20 &&
                        /^[a-zA-Z0-9]+$/.test(n.from);
                      const senderName =
                        looksLikeUid || n.fromUid
                          ? users?.find((u) => u.uid === uid)?.displayName ||
                            users?.find((u) => u.uid === uid)?.email ||
                            n.fromName ||
                            n.from ||
                            "Someone"
                          : n.fromName || n.from || "Someone";
                      const itemName =
                        n.item && String(n.item).trim() ? n.item : "a gift";
                      const likeLabel =
                        n.targetType === "book"
                          ? `${senderName} liked your book${n.targetTitle ? ` "${n.targetTitle}"` : ""}`
                          : `${senderName} liked your news${n.targetTitle ? ` "${n.targetTitle}"` : ""}`;
                      const baseLabel = isGift
                        ? `You received ${itemName} from ${senderName}`
                        : isChat
                          ? `Message from ${senderName}`
                          : isGroupChat
                            ? n.type === "group_chat_added"
                              ? `${senderName} added you to group "${n.groupName || "Group"}"`
                              : `Reply from group "${n.groupName || "Group"}" — ${senderName}`
                            : isProfileLike
                              ? `${senderName} liked your profile`
                              : isLike
                                ? likeLabel
                                : isReply
                                  ? n.message ||
                                    n.title ||
                                    `New activity in ${n.topicTitle || n.forumRoom || "forum"}`
                                  : `You received ${itemName} from ${senderName}`;
                      const label =
                        count > 1 && (isChat || isGroupChat || isReply)
                          ? `${baseLabel} (${count} ${isChat ? "messages" : isGroupChat ? "group" : "updates"})`
                          : baseLabel;
                      const forumPath = normalizeForumPath(n.forum || n.forumRoom || "");
                      return (
                        <div
                          key={group.key}
                          className={styles.notificationItem}
                          role="button"
                          tabIndex={0}
                          onClick={async (e) => {
                            if (
                              e.target.closest(
                                `.${styles.notificationRemoveBtn}`,
                              )
                            )
                              return;
                            try {
                              await Promise.all(
                                group.items.map((item) =>
                                  updateDoc(doc(db, "notifications", item.id), {
                                    read: true,
                                  }),
                                ),
                              );
                              setNotifications((prev) =>
                                prev.map((x) =>
                                  group.items.some((i) => i.id === x.id)
                                    ? { ...x, read: true }
                                    : x,
                                ),
                              );
                            } catch (err) {}
                            setShowNotificationsPanel(false);
                            if (isReply && (n.topicId || forumPath))
                              navigate(
                                `/forum/${forumPath || "general"}?topic=${n.topicId || ""}`,
                              );
                            if (isChat) {
                              const fromUid = n.fromUid || n.from;
                              if (fromUid) setOpenWithUid(fromUid);
                            }
                            if (
                              isLike &&
                              (n.targetType === "news" ||
                                n.targetType === "book")
                            )
                              navigate(
                                n.targetType === "book" ? "/shop" : "/news",
                              );
                            if (isProfileLike)
                              navigate(`/user/${n.fromUid || n.from}`);
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && e.currentTarget.click()
                          }
                        >
                          {isGift && (
                            <span className={styles.notificationIconGift}>
                              🎁
                            </span>
                          )}
                          {isChat && (
                            <span className={styles.notificationIconChat}>
                              💬
                            </span>
                          )}
                          {isGroupChat && (
                            <span className={styles.notificationIconChat}>
                              👥
                            </span>
                          )}
                          {isReply && (
                            <span className={styles.notificationIconReply}>
                              📌
                            </span>
                          )}
                          {isLike && (
                            <span className={styles.notificationIconLike}>
                              ❤️
                            </span>
                          )}
                          {isProfileLike && (
                            <span className={styles.notificationIconLike}>
                              ❤️
                            </span>
                          )}
                          {!isGift &&
                            !isChat &&
                            !isGroupChat &&
                            !isReply &&
                            !isLike &&
                            !isProfileLike && (
                              <span className={styles.notificationIconGift}>
                                🎁
                              </span>
                            )}
                          <span className={styles.notificationText}>
                            {label}
                          </span>
                          <button
                            type="button"
                            className={styles.notificationRemoveBtn}
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                await Promise.all(
                                  group.items.map((item) =>
                                    deleteDoc(
                                      doc(db, "notifications", item.id),
                                    ),
                                  ),
                                );
                                setNotifications((prev) =>
                                  prev.filter(
                                    (x) =>
                                      !group.items.some((i) => i.id === x.id),
                                  ),
                                );
                              } catch (err) {}
                            }}
                            title="Remove notification"
                            aria-label="Remove notification"
                          >
                            ×
                          </button>
                        </div>
                      );
                    });
                  })()}
                  {recentNews.length === 0 &&
                    notifications.filter((n) => !n.read).length === 0 && (
                      <p className={styles.notificationEmpty}>
                        No notifications
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Online-liste: knapp som åpner listen i popup */}
        {user && (
          <div className={styles.onlineListWrap} ref={onlinePanelRef}>
            <button
              type="button"
              className={styles.inventoryIconBtn}
              onClick={async () => {
                const next = !showOnlinePanel;
                setShowOnlinePanel(next);
                requestOpen("topbar", next);
                if (user?.uid) {
                  try {
                    if (next) {
                      await setDoc(
                        doc(db, "users", user.uid),
                        { online: true, lastLogin: serverTimestamp() },
                        { merge: true }
                      );
                    } else {
                      await setDoc(
                        doc(db, "users", user.uid),
                        { online: false },
                        { merge: true }
                      );
                    }
                  } catch (e) {
                    if (process.env.NODE_ENV === "development") console.warn("Online status write:", e);
                  }
                }
              }}
              title="Hvem er online"
              aria-label="Hvem er online"
              aria-expanded={showOnlinePanel}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </button>
            {showOnlinePanel && (
              <div className={styles.onlineListPopup}>
                <OnlineUsers variant="popup" />
              </div>
            )}
          </div>
        )}
        <button
          className={styles.inventoryIconBtn}
          onClick={() => {
            setShowFollowedTopics(!showFollowedTopics);
            setCurrentPage(1); // Reset to first page when opening
          }}
          title="Followed Topics"
          style={{
            background: "#E8DDD4",
            color: "#7B6857",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          ※
        </button>
        <Link
          to="/messages"
          className={styles.inventoryIconBtn}
          title="Private messages"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.4rem 0.6rem",
            textDecoration: "none",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </Link>
        <a
          href="https://discord.gg/gAdpq5ZE6E"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.inventoryIconBtn}
          title="Join our Discord server"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.4rem 0.6rem",
            textDecoration: "none",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={styles.discordIcon}
            aria-hidden
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </a>
        {/* Love Potion: in love text */}
        {inLoveUntil && inLoveUntil > Date.now() && inLoveWith && (
          <span
            className={styles.inLoveText}
            style={{
              marginLeft: 16,
              color: "#ff69b4",
              fontWeight: 700,
              fontSize: "1.1rem",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            }}
          >
            In love with {inLoveWith}
            {inLoveCountdown > 0 && (
              <span
                style={{ marginLeft: 8, fontSize: "0.95rem", color: "#fff" }}
              >
                ({String(Math.floor(inLoveCountdown / 60)).padStart(2, "0")}:
                {String(inLoveCountdown % 60).padStart(2, "0")})
              </span>
            )}
          </span>
        )}
        <GiftModal
          open={giftModal.open}
          onClose={() => setGiftModal({ open: false, item: null })}
          item={giftModal.item}
          users={users}
          inventory={userData?.inventory || []}
          onGift={async (toUser, disguise) => {
            if (!user || !giftModal.item) return;
            // Remove one from sender
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) return;
            let inv = userDoc.data().inventory || [];
            const idx = inv.findIndex((i) => i.name === giftModal.item.name);
            if (idx === -1) return;
            inv[idx].qty = (inv[idx].qty || 1) - 1;
            if (inv[idx].qty <= 0) inv.splice(idx, 1);
            await updateDoc(userRef, { inventory: inv });

            // Clear cache after inventory update
            cacheHelpers.clearUserCache(user.uid);

            // Add to recipient (bruk alltid uid)
            const toRef = doc(db, "users", toUser.uid);
            const toDoc = await getDoc(toRef);
            let toInv = (toDoc.exists() ? toDoc.data().inventory : []) || [];
            // Sjekk om disguised name finnes fra før
            const toIdx = toInv.findIndex(
              (i) => i.name === (disguise?.name || giftModal.item.name),
            );
            const giftedBy =
              user.displayName && user.displayName.trim()
                ? user.displayName
                : user.email || "Unknown";
            if (toIdx === -1) {
              // Add disguised item, men fjern undefined-felter
              const rawItem = {
                ...giftModal.item,
                name: disguise?.name || giftModal.item.name,
                description:
                  disguise?.description || giftModal.item.description,
                type: disguise?.type || giftModal.item.type,
                category: disguise?.category || giftModal.item.category,
                qty: 1,
                giftedBy: giftedBy,
                originalName:
                  disguise && disguise.name !== giftModal.item.name
                    ? giftModal.item.name
                    : undefined,
                realItem:
                  disguise && disguise.name !== giftModal.item.name
                    ? giftModal.item.name
                    : undefined,
              };
              const cleanItem = Object.fromEntries(
                Object.entries(rawItem).filter(([, v]) => v !== undefined),
              );
              toInv.push(cleanItem);
            } else {
              toInv[toIdx].qty = (toInv[toIdx].qty || 1) + 1;
              toInv[toIdx].giftedBy = giftedBy;
              // Preserve original item info if disguised
              if (disguise && disguise.name !== giftModal.item.name) {
                toInv[toIdx].originalName = giftModal.item.name;
                toInv[toIdx].realItem = giftModal.item.name;
              }
              // Fjern undefined-felter fra eksisterende item
              Object.keys(toInv[toIdx]).forEach((key) => {
                if (toInv[toIdx][key] === undefined) delete toInv[toIdx][key];
              });
            }
            // Bygg nytt dokument med nøyaktig samme key-rekkefølge som i mottakerens dokument
            const oldDoc = toDoc.data();
            const updatedDoc = {};
            Object.keys(oldDoc).forEach((key) => {
              if (key === "inventory") {
                updatedDoc.inventory = toInv;
              } else {
                updatedDoc[key] = oldDoc[key];
              }
            });
            try {
              await updateDoc(toRef, updatedDoc);
            } catch (e) {
              // window.alert fjernet etter feilsøking
            }
            // Legg til notification til mottaker
            await addDoc(collection(db, "notifications"), {
              to: toUser.uid,
              type: "gift",
              from:
                user.displayName && user.displayName.trim()
                  ? user.displayName
                  : user.email || user.uid,
              fromUid: user.uid,
              item: disguise?.name || giftModal.item.name,
              disguised:
                giftModal.item.name !== (disguise?.name || giftModal.item.name),
              realItem: giftModal.item.name,
              read: false,
              created: Date.now(),
            });
            setGiftModal({ open: false, item: null });
          }}
        />
        {/* Close notifications panel on outside click */}
        {showNotificationsPanel && (
          <div
            role="presentation"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 998,
            }}
            onClick={() => setShowNotificationsPanel(false)}
          />
        )}

        {/* Close online panel on outside click */}
        {showOnlinePanel && (
          <div
            role="presentation"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 998,
            }}
            onClick={() => closeOnlinePanel()}
          />
        )}

        {/* Followed Topics Modal */}
        {showFollowedTopics && (
          <div className={styles.followedTopicsModal}>
            <div className={styles.followedTopicsContent}>
              <div className={styles.followedTopicsHeader}>
                <h3>Followed Topics</h3>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowFollowedTopics(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.followedTopicsList}>
                {followedTopics.length === 0 ? (
                  <p>No topics followed yet</p>
                ) : (
                  currentTopics.map((topic) => (
                    <div key={topic.id} className={styles.followedTopicItem}>
                      <div
                        className={styles.topicClickableArea}
                        onClick={() => {
                          // Navigate directly to the specific topic (use forumRoom if stored, else forum title; normalize for URL)
                          const forumPath = normalizeForumPath(topic.forumRoom || topic.forum || "");
                          navigate(`/forum/${forumPath}?topic=${topic.id}`);
                          setShowFollowedTopics(false);
                        }}
                      >
                        <span className={styles.topicTitle}>{topic.title}</span>
                        <span className={styles.topicForum}>{topic.forum}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Remove from followed topics
                          const updatedTopics = followedTopics.filter(
                            (t) => t.id !== topic.id,
                          );
                          setFollowedTopics(updatedTopics);
                          // Update database
                          updateDoc(doc(db, "users", user.uid), {
                            followedTopics: updatedTopics,
                          });
                        }}
                        style={{
                          background: "#ff6b6b",
                          color: "white",
                          border: "none",
                          borderRadius: 0,
                          padding: "4px 8px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {followedTopics.length > topicsPerPage && (
                <div className={styles.paginationControls}>
                  <button
                    className={styles.paginationBtn}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>

                  <span className={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    className={styles.paginationBtn}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TopBar;
