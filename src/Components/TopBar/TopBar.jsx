// src/Components/TopBar/TopBar.jsx

import { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { useRef } from "react";
import GiftModal from "./GiftModal";
import useUsers from "../../hooks/useUser";
import { toggleMagicalCursor } from "../../assets/Cursor/magicalCursor.js";

import styles from "./TopBar.module.css";

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
  const [balance, setBalance] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [points, setPoints] = useState(0);
  const [showInventory, setShowInventory] = useState(false);
  const [health, setHealth] = useState(100);
  const [roles, setRoles] = useState([]);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [infirmary, setInfirmary] = useState(false);
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
  const [magicalCursorEnabled, setMagicalCursorEnabled] = useState(true);
  
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
  const [luckyUntil, setLuckyUntil] = useState(null);
  const [wisdomUntil, setWisdomUntil] = useState(null);
  const [surveillanceUntil, setSurveillanceUntil] = useState(null);
  const [charmUntil, setCharmUntil] = useState(null);
  const [mysteryUntil, setMysteryUntil] = useState(null);
  const intervalRef = useRef();
  const { users } = useUsers();

  const handleMagicalCursorToggle = () => {
    setMagicalCursorEnabled(!magicalCursorEnabled);
    toggleMagicalCursor();
  };

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, async (userDoc) => {
      try {
        if (userDoc.exists()) {
          const data = userDoc.data();
          setBalance(data.currency ?? 1000);
          setInventory(data.inventory ?? []);
          setHealth(data.health ?? 100);
          setPoints(data.points ?? 0);
          setRoles(data.roles ?? []);
          setProfileImageUrl(data.profileImageUrl || null);
          // Sett lastHealthUpdate første gang hvis mangler
          if (!data.lastHealthUpdate) {
            await updateDoc(userRef, { lastHealthUpdate: Date.now() });
          }
          // Love Potion effect
          if (data.inLoveUntil && data.inLoveUntil > Date.now()) {
            setInLoveWith(data.inLoveWith || "Someone");
            setInLoveUntil(data.inLoveUntil);
          } else {
            setInLoveWith(null);
            setInLoveUntil(null);
          }
          
          // New potion effects
          setHairColorUntil(data.hairColorUntil && data.hairColorUntil > Date.now() ? data.hairColorUntil : null);
          setRainbowUntil(data.rainbowUntil && data.rainbowUntil > Date.now() ? data.rainbowUntil : null);
          setGlowUntil(data.glowUntil && data.glowUntil > Date.now() ? data.glowUntil : null);
          setSparkleUntil(data.sparkleUntil && data.sparkleUntil > Date.now() ? data.sparkleUntil : null);
          setTranslationUntil(data.translationUntil && data.translationUntil > Date.now() ? data.translationUntil : null);
          setEchoUntil(data.echoUntil && data.echoUntil > Date.now() ? data.echoUntil : null);
          setWhisperUntil(data.whisperUntil && data.whisperUntil > Date.now() ? data.whisperUntil : null);
          setShoutUntil(data.shoutUntil && data.shoutUntil > Date.now() ? data.shoutUntil : null);
          setDarkModeUntil(data.darkModeUntil && data.darkModeUntil > Date.now() ? data.darkModeUntil : null);
          setRetroUntil(data.retroUntil && data.retroUntil > Date.now() ? data.retroUntil : null);
          setMirrorUntil(data.mirrorUntil && data.mirrorUntil > Date.now() ? data.mirrorUntil : null);
          setSpeedUntil(data.speedUntil && data.speedUntil > Date.now() ? data.speedUntil : null);
          setSlowMotionUntil(data.slowMotionUntil && data.slowMotionUntil > Date.now() ? data.slowMotionUntil : null);
          setLuckyUntil(data.luckyUntil && data.luckyUntil > Date.now() ? data.luckyUntil : null);
          setWisdomUntil(data.wisdomUntil && data.wisdomUntil > Date.now() ? data.wisdomUntil : null);
          setSurveillanceUntil(data.surveillanceUntil && data.surveillanceUntil > Date.now() ? data.surveillanceUntil : null);
          setCharmUntil(data.charmUntil && data.charmUntil > Date.now() ? data.charmUntil : null);
          setMysteryUntil(data.mysteryUntil && data.mysteryUntil > Date.now() ? data.mysteryUntil : null);
          
          // Infirmary state
          if (data.infirmaryEnd && Date.now() < data.infirmaryEnd) {
            setInfirmary(true);
            setInfirmaryEnd(data.infirmaryEnd);
          } else {
            setInfirmary(false);
            setInfirmaryEnd(null);
          }
          
          // Detention state
          if (data.detentionUntil && Date.now() < data.detentionUntil) {
            setDetentionUntil(data.detentionUntil);
          } else {
            setDetentionUntil(null);
          }
          if (data.invisibleUntil && Date.now() < data.invisibleUntil) {
            setInvisibleUntil(data.invisibleUntil);
          } else {
            setInvisibleUntil(null);
          }
        }
      } catch (error) {
        console.error("Error in TopBar useEffect:", error);
      }
    });
    return () => {
      try {
        unsub && unsub();
      } catch (error) {
        console.warn("Error unsubscribing from user data:", error);
      }
    };
  }, [user]);

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
    const msPerHp = (1.5 * 24 * 60 * 60 * 1000) / 100; // 1,5 dag fra 100 til 0 HP
    const healthPerDecay = 1;
    const userRef = doc(db, "users", user.uid);

    async function decayHealth() {
      try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) return;
        const data = userDoc.data();
        // Fjern lockout på decayHealth, så vi alltid kan tvinge fainting og resette infirmaryEnd

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
    } catch (error) {
      console.error("Error in decayHealth:", error);
    }
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
        const secs = Math.max(0, Math.floor((infirmaryEnd - Date.now()) / 1000));
        setCountdown(secs);
        if (secs <= 0) {
          // Ferdig, gjenopprett health
          if (user) {
            const userRef = doc(db, "users", user.uid);
            updateDoc(userRef, { health: 100, infirmaryEnd: null });
          }
          setInfirmary(false);
          setInfirmaryEnd(null);
        }
      } catch (error) {
        console.error("Error in infirmary countdown:", error);
      }
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
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("to", "==", user.uid),
      where("read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      try {
        setNotifications(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error in notifications useEffect:", error);
      }
    });
    return () => {
      try {
        unsub();
      } catch (error) {
        console.warn("Error unsubscribing from notifications:", error);
      }
    };
  }, [user]);

  return (
    <>
      {infirmary && (
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
                boxShadow: "0 0 16px 6px #ff69b4, 0 0 32px 12px #ffb6d5 inset"
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
              const src = user.photoURL || profileImageUrl || "/icons/avatar.svg";
              // Compute role-based class
              let roleClass = styles.profilePic;
              const lower = (roles || []).map((r) => String(r).toLowerCase());
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
                  className={`${roleClass} ${sparkleUntil && sparkleUntil > Date.now() ? 'sparkle-effect' : ''}`}
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
            <HealthBar health={health} maxHealth={100} />
          </div>
        <div className={styles.currency}>
            <img
              src="/icons/gold-coin.svg"
              alt="Nits"
              className={styles.coinIcon}
            />
            {balance} Nits
            <span style={{ marginLeft: 16, color: "#4fc3f7", fontWeight: 700 }}>
              ◆ {points} points
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
                {String(Math.floor((detentionUntil - Date.now()) / (1000 * 60 * 60))).padStart(2, "0")}:
                {String(Math.floor(((detentionUntil - Date.now()) % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0")}:
                {String(Math.floor(((detentionUntil - Date.now()) % (1000 * 60)) / 1000)).padStart(2, "0")}
              </span>
            )}
          </div>
        <button
            className={`${styles.inventoryIconBtn} ${styles.hideOnMobile}`}
            onClick={() => setShowInventory((v) => !v)}
            title="Inventory"
            disabled={infirmary}
          >
            <img
              src="/icons/chest.svg"
              alt="Inventory"
              className={styles.chestIcon}
            />
          </button>
        <button
            className={styles.inventoryIconBtn}
            onClick={handleMagicalCursorToggle}
            title={magicalCursorEnabled ? "Disable Magical Cursor" : "Enable Magical Cursor"}
            style={{
              background: magicalCursorEnabled ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : '#E8DDD4',
              color: magicalCursorEnabled ? '#2C2C2C' : '#7B6857',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ✦
          </button>
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
        {showInventory && !infirmary && (
          <div
            className={styles.inventoryPopup}
            onClick={() => setShowInventory(false)}
          >
            <div
              className={styles.inventoryPopupContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h4>Inventory</h4>
              {inventory.length === 0 ? (
                <span className={styles.empty}>Empty</span>
              ) : (
                <ul className={styles.itemList}>
                  {inventory.map((item, idx) => {
                    // Mat og potions kan spises/drikkes
                    const isEdible =
                      item.type === "food" || item.type === "potion";
                    let healAmount = 0;
                    const isDeathPotion = item.name === "Death Draught";
                    if (item.name === "Chocolate Frog") healAmount = 15;
                    if (item.name === "Healing Potion") healAmount = 1000; // Fills health to max
                    // Firestore-mat: bruk health-feltet hvis satt
                    if (
                      item.type === "food" &&
                      typeof item.health === "number"
                    ) {
                      healAmount = item.health;
                    }
                    return (
                      <li key={idx} className={styles.itemRow}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span> x
                          {item.qty || 1}
                          {typeof item.health === "number" &&
                            item.type === "food" && (
                              <span style={{ color: "#6f6", marginLeft: 6 }}>
                                (+{item.health} HP)
                              </span>
                            )}
                        </div>
                        <div className={styles.itemButtons}>
                          {/* Gift button */}
                          <button
                            className={styles.giftBtn}
                            title="Gift this item"
                            onClick={() => setGiftModal({ open: true, item })}
                          >
                            ⚜
                          </button>
                          {/* Delete button */}
                          <button
                            className={styles.deleteBtn}
                            title="Delete this item"
                            onClick={async () => {
                              if (!user) return;
                              const userRef = doc(db, "users", user.uid);
                              const userDoc = await getDoc(userRef);
                              if (!userDoc.exists()) return;
                              let inv = userDoc.data().inventory || [];
                              const invIdx = inv.findIndex(
                                (i) => i.name === item.name
                              );
                              if (invIdx === -1) return;
                              // Only remove one item, not all
                              inv[invIdx].qty = (inv[invIdx].qty || 1) - 1;
                              if (inv[invIdx].qty <= 0) {
                                inv.splice(invIdx, 1);
                              }
                              await updateDoc(userRef, { inventory: inv });
                            }}
                          >
                            ✕
                          </button>
                          {isEdible && !infirmary && (
                            <button
                              className={styles.eatBtn}
                              onClick={async () => {
                              if (!user) return;
                              const userRef = doc(db, "users", user.uid);
                              const userDoc = await getDoc(userRef);
                              if (!userDoc.exists()) return;
                              const data = userDoc.data();
                              let inv = data.inventory || [];
                              const invIdx = inv.findIndex(
                                (i) => i.name === item.name
                              );
                              if (invIdx === -1) return;
                              // Fjern én av denne matvaren
                              inv[invIdx].qty = (inv[invIdx].qty || 1) - 1;
                              if (inv[invIdx].qty <= 0) inv.splice(invIdx, 1);
                              let update = {
                                inventory: inv,
                                lastHealthUpdate: Date.now(),
                              };
                              // Find original name if disguised
                              const realName =
                                item.originalName || item.realItem || item.name;
                              
                              // Debug log to help troubleshoot
                              console.log('Consuming item:', {
                                displayName: item.name,
                                realName: realName,
                                originalName: item.originalName,
                                realItem: item.realItem,
                                giftedBy: item.giftedBy
                              });
                              if (realName === "Death Draught") {
                                update.health = 0;
                                update.infirmaryEnd =
                                  Date.now() + 20 * 60 * 1000;
                              } else if (realName === "Healing Potion") {
                                update.health = 100;
                              } else if (realName === "Invisibility Draught") {
                                update.invisibleUntil =
                                  Date.now() + 5 * 60 * 1000;
                              } else if (realName === "Love Potion") {
                                // Love Potion effect: use giftedBy from inventory if available, otherwise fallback to notification
                                let giver = item.giftedBy;
                                console.log('Love Potion - giver from item:', giver);
                                
                                if (!giver) {
                                  try {
                                    // Search for notification with the disguised item name
                                    const notifQuery = query(
                                      collection(db, "notifications"),
                                      where("to", "==", user.uid),
                                      where("item", "==", item.name), // Use the disguised name
                                      where("read", "==", false)
                                    );
                                    const notifSnap = await getDocs(notifQuery);
                                    console.log('Found notifications:', notifSnap.docs.length);
                                    
                                    if (!notifSnap.empty) {
                                      // Use the most recent notification
                                      const notifDoc = notifSnap.docs
                                        .map((d) => d)
                                        .sort(
                                          (a, b) =>
                                            b.data().created - a.data().created
                                        )[0];
                                      const notif = notifDoc.data();
                                      console.log('Using notification:', notif);
                                      
                                      if (notif && notif.from) {
                                        giver = notif.from;
                                        // Mark notification as read
                                        await updateDoc(
                                          doc(db, "notifications", notifDoc.id),
                                          { read: true }
                                        );
                                      }
                                    }
                                  } catch (e) {
                                    console.error('Error finding notification:', e);
                                    giver = "Unknown";
                                  }
                                }
                                if (!giver) giver = "Unknown";
                                console.log('Final giver for Love Potion:', giver);
                                
                                update.inLoveUntil =
                                  Date.now() + 60 * 60 * 1000; // 1 time
                                update.inLoveWith = giver;
                              } else if (realName === "Hair Color Potion") {
                                update.hairColorUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
                              } else if (realName === "Rainbow Potion") {
                                update.rainbowUntil = Date.now() + 60 * 60 * 1000; // 1 hour
                              } else if (realName === "Glow Potion") {
                                update.glowUntil = Date.now() + 3 * 60 * 60 * 1000; // 3 hours
                              } else if (realName === "Sparkle Potion") {
                                update.sparkleUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
                              } else if (realName === "Translation Potion") {
                                update.translationUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
                              } else if (realName === "Echo Potion") {
                                update.echoUntil = Date.now() + 60 * 60 * 1000; // 1 hour
                              } else if (realName === "Whisper Potion") {
                                update.whisperUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
                              } else if (realName === "Shout Potion") {
                                update.shoutUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
                              } else if (realName === "Dark Mode Potion") {
                                update.darkModeUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
                              } else if (realName === "Retro Potion") {
                                update.retroUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
                              } else if (realName === "Mirror Potion") {
                                update.mirrorUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
                              } else if (realName === "Speed Potion") {
                                update.speedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
                              } else if (realName === "Slow Motion Potion") {
                                update.slowMotionUntil = Date.now() + 60 * 60 * 1000; // 1 hour
                              } else if (realName === "Lucky Potion") {
                                update.luckyUntil = Date.now() + 3 * 60 * 60 * 1000; // 3 hours
                              } else if (realName === "Wisdom Potion") {
                                update.wisdomUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
                              } else if (realName === "Surveillance Potion") {
                                update.surveillanceUntil = Date.now() + 60 * 60 * 1000; // 1 hour
                              } else if (realName === "Charm Potion") {
                                update.charmUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
                              } else if (realName === "Mystery Potion") {
                                update.mysteryUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
                              } else {
                                let newHealth =
                                  (data.health || 100) + healAmount;
                                if (newHealth > 100) newHealth = 100;
                                update.health = newHealth;
                              }
                              await updateDoc(userRef, update);
                            }}
                          >
                            {item.name === "Death Draught" ||
                            item.name === "Invisibility Draught" ||
                            item.name === "Love Potion" ||
                            item.name === "Hair Color Potion" ||
                            item.name === "Rainbow Potion" ||
                            item.name === "Glow Potion" ||
                            item.name === "Sparkle Potion" ||
                            item.name === "Translation Potion" ||
                            item.name === "Echo Potion" ||
                            item.name === "Whisper Potion" ||
                            item.name === "Shout Potion" ||
                            item.name === "Dark Mode Potion" ||
                            item.name === "Retro Potion" ||
                            item.name === "Mirror Potion" ||
                            item.name === "Speed Potion" ||
                            item.name === "Slow Motion Potion" ||
                            item.name === "Lucky Potion" ||
                            item.name === "Wisdom Potion" ||
                            item.name === "Surveillance Potion" ||
                            item.name === "Charm Potion" ||
                            item.name === "Mystery Potion"
                              ? "Drink"
                              : "Eat"}
                          </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                className={styles.closeBtn}
                onClick={() => setShowInventory(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        <GiftModal
          open={giftModal.open}
          onClose={() => setGiftModal({ open: false, item: null })}
          item={giftModal.item}
          users={users}
          inventory={inventory}
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
            ! You received a gift from {notifications[0].from}:{" "}
            {notifications[0].item}
          </div>
        )}
      </div>
    </>
  );
};

export default TopBar;
