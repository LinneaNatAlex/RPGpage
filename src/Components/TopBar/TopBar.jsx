// src/Components/TopBar/TopBar.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { useRef } from "react";
import GiftModal from "./GiftModal";
import useUsers from "../../hooks/useUser";
import useUserData from "../../hooks/useUserData";
import useUserRoles from "../../hooks/useUserRoles";
import { cacheHelpers } from "../../utils/firebaseCache";

import styles from "./TopBar.module.css";

// Helper function to update user doc and clear cache
const updateUserDocWithCacheClear = async (userRef, updates, userId) => {
  await updateDoc(userRef, updates);
  cacheHelpers.clearUserCache(userId);
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
  const [infirmary, setInfirmary] = useState(false);
  const isAdmin = roles?.some((r) => String(r).toLowerCase() === "admin");
  const [detentionUntil, setDetentionUntil] = useState(null);
  const [infirmaryEnd, setInfirmaryEnd] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [invisibleUntil, setInvisibleUntil] = useState(null);
  const [invisibleCountdown, setInvisibleCountdown] = useState(0);
  const [giftModal, setGiftModal] = useState({ open: false, item: null });
  const [notifications, setNotifications] = useState([]);
  const [inLoveWith, setInLoveWith] = useState(null);
  const [inLoveUntil, setInLoveUntil] = useState(null);
  const [inLoveCountdown, setInLoveCountdown] = useState(0);
  const [showFollowedTopics, setShowFollowedTopics] = useState(false);
  const [followedTopics, setFollowedTopics] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const topicsPerPage = 10;

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

  // Listen for changes in followed topics
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setFollowedTopics(userData.followedTopics || []);
        }
      },
      (err) => {
        if (err?.code === "permission-denied") return;
        if (process.env.NODE_ENV === "development")
          console.warn("TopBar followedTopics snapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Listen for new posts in followed topics
  useEffect(() => {
    if (!user || followedTopics.length === 0) return;

    const unsubscribeFunctions = [];

    followedTopics.forEach((topic) => {
      // Listen to posts in this topic
      const postsRef = collection(
        db,
        `forums/${topic.forum.toLowerCase().replace(" ", "")}/topics/${
          topic.id
        }/posts`
      );
      const q = query(postsRef, orderBy("createdAt", "desc"), limit(1));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const post = change.doc.data();
              // Check if this is a new post (not the first one)
              if (post.createdAt && post.createdAt.toDate) {
                const postTime = post.createdAt.toDate();
                const now = new Date();
                const timeDiff = now - postTime;

                // Only notify if post is very recent (within last 30 seconds)
                if (timeDiff < 30000 && post.uid !== user.uid) {
                  // Create notification
                  addDoc(collection(db, "notifications"), {
                    userId: user.uid,
                    type: "topic_reply",
                    topicId: topic.id,
                    topicTitle: topic.title,
                    forum: topic.forum,
                    author: post.author,
                    content: post.content,
                    createdAt: serverTimestamp(),
                    read: false,
                  });
                }
              }
            }
          });
        },
        (err) => {
          if (err?.code === "permission-denied") return;
          if (process.env.NODE_ENV === "development")
            console.warn("TopBar followed topics posts snapshot error:", err);
        }
      );

      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    };
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
        : null
    );
    setRainbowUntil(
      userData.rainbowUntil && userData.rainbowUntil > Date.now()
        ? userData.rainbowUntil
        : null
    );
    setGlowUntil(
      userData.glowUntil && userData.glowUntil > Date.now()
        ? userData.glowUntil
        : null
    );
    setSparkleUntil(
      userData.sparkleUntil && userData.sparkleUntil > Date.now()
        ? userData.sparkleUntil
        : null
    );
    setTranslationUntil(
      userData.translationUntil && userData.translationUntil > Date.now()
        ? userData.translationUntil
        : null
    );
    setEchoUntil(
      userData.echoUntil && userData.echoUntil > Date.now()
        ? userData.echoUntil
        : null
    );
    setWhisperUntil(
      userData.whisperUntil && userData.whisperUntil > Date.now()
        ? userData.whisperUntil
        : null
    );
    setShoutUntil(
      userData.shoutUntil && userData.shoutUntil > Date.now()
        ? userData.shoutUntil
        : null
    );
    setDarkModeUntil(
      userData.darkModeUntil && userData.darkModeUntil > Date.now()
        ? userData.darkModeUntil
        : null
    );
    setRetroUntil(
      userData.retroUntil && userData.retroUntil > Date.now()
        ? userData.retroUntil
        : null
    );
    setMirrorUntil(
      userData.mirrorUntil && userData.mirrorUntil > Date.now()
        ? userData.mirrorUntil
        : null
    );
    setSpeedUntil(
      userData.speedUntil && userData.speedUntil > Date.now()
        ? userData.speedUntil
        : null
    );
    setSlowMotionUntil(
      userData.slowMotionUntil && userData.slowMotionUntil > Date.now()
        ? userData.slowMotionUntil
        : null
    );
    setSurveillanceUntil(
      userData.surveillanceUntil && userData.surveillanceUntil > Date.now()
        ? userData.surveillanceUntil
        : null
    );
    setLuckyUntil(
      userData.luckyUntil && userData.luckyUntil > Date.now()
        ? userData.luckyUntil
        : null
    );
    setWisdomUntil(
      userData.wisdomUntil && userData.wisdomUntil > Date.now()
        ? userData.wisdomUntil
        : null
    );
    setCharmUntil(
      userData.charmUntil && userData.charmUntil > Date.now()
        ? userData.charmUntil
        : null
    );
    setMysteryUntil(
      userData.mysteryUntil && userData.mysteryUntil > Date.now()
        ? userData.mysteryUntil
        : null
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
          Math.floor((infirmaryEnd - Date.now()) / 1000)
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
        Math.floor((invisibleUntil - Date.now()) / 1000)
      );
      setInvisibleCountdown(secs);
      if (secs <= 0) setInvisibleUntil(null);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [invisibleUntil]);

  // Hent notifications for innlogget bruker
  // QUOTA OPTIMIZATION: Use caching + polling for notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        // Check cache first
        const cachedNotifications = cacheHelpers.getNotifications(user.uid);
        if (cachedNotifications) {
          setNotifications(cachedNotifications);
          return;
        }

        // Fetch from Firebase if no cache
        const q = query(
          collection(db, "notifications"),
          where("to", "==", user.uid),
          where("read", "==", false)
        );
        const snap = await getDocs(q);
        const notifications = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Cache the notifications
        cacheHelpers.setNotifications(user.uid, notifications);
        setNotifications(notifications);
      } catch (error) {}
    };

    // Fetch initially
    fetchNotifications();

    // Poll every 30 seconds for notifications
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [user]);

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
          {(() => {
            if (!user) return null;
            const src =
              user.photoURL || userData?.profileImageUrl || "/icons/avatar.svg";
            // Compute role-based class
            let roleClass = styles.profilePic;
            const lower = (userData?.roles || []).map((r) =>
              String(r).toLowerCase()
            );
            if (lower.includes("headmaster"))
              roleClass += ` ${styles.headmasterPic}`;
            else if (lower.includes("teacher"))
              roleClass += ` ${styles.teacherPic}`;
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
                Math.floor((detentionUntil - Date.now()) / (1000 * 60 * 60))
              ).padStart(2, "0")}
              :
              {String(
                Math.floor(
                  ((detentionUntil - Date.now()) % (1000 * 60 * 60)) /
                    (1000 * 60)
                )
              ).padStart(2, "0")}
              :
              {String(
                Math.floor(((detentionUntil - Date.now()) % (1000 * 60)) / 1000)
              ).padStart(2, "0")}
            </span>
          )}
        </div>
        <button
          className={`${styles.inventoryIconBtn} ${styles.hideOnMobile}`}
          onClick={() => navigate("/inventory")}
          title="Inventory"
          disabled={infirmary}
          style={{ position: "relative" }}
        >
          <img
            src="/icons/magic-school.svg"
            alt="Inventory"
            className={styles.chestIcon}
          />
          {notifications.length > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-5px",
                right: "-5px",
                background: "#ff5e5e",
                color: "white",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
                border: "2px solid #fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                zIndex: 10,
              }}
            >
              !
            </span>
          )}
        </button>
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
              (i) => i.name === (disguise?.name || giftModal.item.name)
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
                Object.entries(rawItem).filter(([, v]) => v !== undefined)
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
              from:
                user.displayName && user.displayName.trim()
                  ? user.displayName
                  : user.email || "Unknown",
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
        {/* Fainted overlay moved to global overlay above */}
        {/* Notification bell/alert */}
        {notifications.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 16,
              color: "#ff0",
              fontWeight: 700,
              cursor: "pointer",
            }}
            title="You have a new gift! Click to mark as read."
            onClick={async () => {
              // Sett alle notifications som lest
              for (const n of notifications) {
                await updateDoc(doc(db, "notifications", n.id), { read: true });
              }
              setNotifications([]);
            }}
          >
            !{" "}
            {notifications[0].type === "topic_reply"
              ? `New reply in "${notifications[0].topicTitle}" by ${notifications[0].author}`
              : `You received a gift from ${notifications[0].from}: ${notifications[0].item}`}
          </div>
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
                          // Navigate directly to the specific topic
                          const forumPath = topic.forum
                            .toLowerCase()
                            .replace(/\s+/g, "");
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
                            (t) => t.id !== topic.id
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
