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
  const [infirmaryEnd, setInfirmaryEnd] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [invisibleUntil, setInvisibleUntil] = useState(null);
  const [invisibleCountdown, setInvisibleCountdown] = useState(0);
  const [giftModal, setGiftModal] = useState({ open: false, item: null });
  const [notifications, setNotifications] = useState([]);
  const [inLoveWith, setInLoveWith] = useState(null);
  const [inLoveUntil, setInLoveUntil] = useState(null);
  const [inLoveCountdown, setInLoveCountdown] = useState(0);
  const intervalRef = useRef();
  const { users } = useUsers();

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, async (userDoc) => {
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
        if (data.infirmaryEnd && Date.now() < data.infirmaryEnd) {
          setInfirmary(true);
          setInfirmaryEnd(data.infirmaryEnd);
        } else {
          setInfirmary(false);
          setInfirmaryEnd(null);
        }
        if (data.invisibleUntil && Date.now() < data.invisibleUntil) {
          setInvisibleUntil(data.invisibleUntil);
        } else {
          setInvisibleUntil(null);
        }
      }
    });
    return () => unsub && unsub();
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
      setNotifications(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
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
      {/* Love Potion: hearts rain overlay */}
      {inLoveUntil && inLoveUntil > Date.now() && (
        <div
          style={{
            pointerEvents: "none",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9998,
            overflow: "hidden",
          }}
        >
          {/* Simple hearts rain animation */}
          {[...Array(30)].map((_, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: `${Math.random() * 100}vw`,
                top: `-${Math.random() * 20}vh`,
                fontSize: `${Math.random() * 2 + 1.5}rem`,
                color: "#ff69b4",
                opacity: 0.7,
                animation: `heartRain 6s linear infinite`,
                animationDelay: `${Math.random() * 6}s`,
              }}
            >
              ❤️
            </span>
          ))}
          <style>{`
            @keyframes heartRain {
              0% { transform: translateY(0); opacity: 0.7; }
              90% { opacity: 0.7; }
              100% { transform: translateY(110vh); opacity: 0; }
            }
          `}</style>
        </div>
      )}
      <div
        className={styles.topBar}
        style={{
          ...(infirmary ? { opacity: 0.5, filter: "grayscale(1)" } : {}),
          ...(inLoveUntil && inLoveUntil > Date.now()
            ? { boxShadow: "0 0 16px 6px #ff69b4, 0 0 32px 12px #ffb6d5 inset" }
            : {}),
        }}
      >
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
                className={roleClass}
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
            ⭐ {points} points
          </span>
          {invisibleUntil && (
            <span style={{ marginLeft: 16, color: "#00e6a8", fontWeight: 700 }}>
              Invisible:{" "}
              {String(Math.floor(invisibleCountdown / 60)).padStart(2, "0")}:
              {String(invisibleCountdown % 60).padStart(2, "0")}
            </span>
          )}
        </div>
        <button
          className={styles.inventoryIconBtn}
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
        {/* Love Potion: in love text */}
        {inLoveUntil && inLoveUntil > Date.now() && inLoveWith && (
          <span
            style={{
              marginLeft: 16,
              color: "#ff69b4",
              fontWeight: 700,
              fontSize: "1.1rem",
              textShadow: "0 0 6px #fff, 0 0 12px #ffb6d5",
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
                    // If it's a food item and has a health property, use that
                    if (
                      item.type === "food" &&
                      typeof item.health === "number"
                    ) {
                      healAmount = item.health;
                    }
                    return (
                      <li key={idx} className={styles.itemRow}>
                        <span className={styles.itemName}>{item.name}</span> x
                        {item.qty || 1}
                        {/* Gift button */}
                        <button
                          className={styles.giftBtn}
                          title="Gift this item"
                          onClick={() => setGiftModal({ open: true, item })}
                          style={{ marginLeft: 8 }}
                        >
                          🎁
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
                                if (!giver) {
                                  try {
                                    const notifQuery = query(
                                      collection(db, "notifications"),
                                      where("to", "==", user.uid),
                                      where("item", "==", "Love Potion"),
                                      where("read", "==", false)
                                    );
                                    const notifSnap = await getDocs(notifQuery);
                                    if (!notifSnap.empty) {
                                      // Use the most recent notification
                                      const notifDoc = notifSnap.docs
                                        .map((d) => d)
                                        .sort(
                                          (a, b) =>
                                            b.data().created - a.data().created
                                        )[0];
                                      const notif = notifDoc.data();
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
                                    giver = "Unknown";
                                  }
                                }
                                if (!giver) giver = "Unknown";
                                update.inLoveUntil =
                                  Date.now() + 60 * 60 * 1000; // 1 time
                                update.inLoveWith = giver;
                              } else {
                                let newHealth =
                                  (data.health || 100) + healAmount;
                                if (newHealth > 100) newHealth = 100;
                                update.health = newHealth;
                              }
                              await updateDoc(userRef, update);
                            }}
                          >
                            {item.name === "Death Draught"
                              ? "Drink"
                              : item.name === "Invisibility Draught"
                              ? "Drink"
                              : item.name === "Love Potion"
                              ? "Drink"
                              : "Eat"}
                          </button>
                        )}
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
