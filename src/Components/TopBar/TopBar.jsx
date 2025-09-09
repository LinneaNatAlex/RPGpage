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
  const [showInventory, setShowInventory] = useState(false);
  const [health, setHealth] = useState(100);
  const [infirmary, setInfirmary] = useState(false);
  const [infirmaryEnd, setInfirmaryEnd] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [invisibleUntil, setInvisibleUntil] = useState(null);
  const [invisibleCountdown, setInvisibleCountdown] = useState(0);
  const [giftModal, setGiftModal] = useState({ open: false, item: null });
  const [notifications, setNotifications] = useState([]);
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
        // Sett lastHealthUpdate første gang hvis mangler
        if (!data.lastHealthUpdate) {
          await updateDoc(userRef, { lastHealthUpdate: Date.now() });
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
      <div
        className={styles.topBar}
        style={infirmary ? { opacity: 0.5, filter: "grayscale(1)" } : {}}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          {user && user.photoURL && (
            <img
              src={user.photoURL}
              alt="Profile"
              className={styles.profilePic}
            />
          )}
          <HealthBar health={health} maxHealth={100} />
        </div>
        <div className={styles.currency}>
          <img
            src="/icons/gold-coin.svg"
            alt="Nits"
            className={styles.coinIcon}
          />
          {balance} Nits
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
                    if (item.name === "Healing Potion") healAmount = 1000; // Fyller health til max
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
                              if (isDeathPotion) {
                                update.health = 0;
                                update.infirmaryEnd =
                                  Date.now() + 20 * 60 * 1000;
                              } else if (item.name === "Healing Potion") {
                                update.health = 100;
                              } else if (item.name === "Invisibility Draught") {
                                update.invisibleUntil =
                                  Date.now() + 5 * 60 * 1000;
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
          users={users} // Ikke filtrer ut egen bruker her, filter i GiftModal
          onGift={async (toUser) => {
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
            const toIdx = toInv.findIndex(
              (i) => i.name === giftModal.item.name
            );
            if (toIdx === -1) {
              toInv.push({ ...giftModal.item, qty: 1 });
            } else {
              toInv[toIdx].qty = (toInv[toIdx].qty || 1) + 1;
            }
            // FEILSØK: Logg alt om mottaker og inventory
            // window.alert fjernet etter feilsøking
            try {
              await updateDoc(toRef, { inventory: toInv });
            } catch (e) {
              // window.alert fjernet etter feilsøking
            }
            // Legg til notification til mottaker
            await addDoc(collection(db, "notifications"), {
              to: toUser.uid,
              from: user.displayName || user.email,
              item: giftModal.item.name,
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
