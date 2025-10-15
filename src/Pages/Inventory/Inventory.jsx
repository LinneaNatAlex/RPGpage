import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { cacheHelpers } from "../../utils/firebaseCache";
import { addImageToItem } from "../../utils/itemImages";
import useUsers from "../../hooks/useUser";
import useUserData from "../../hooks/useUserData";
import GiftModal from "../../Components/TopBar/GiftModal";
import BookViewer from "../../Components/BookViewer/BookViewer";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal/DeleteConfirmModal";
import styles from "./Inventory.module.css";

const Inventory = () => {
  const { user } = useAuth();
  const { userData } = useUserData();
  const { users } = useUsers();
  const [giftModal, setGiftModal] = useState({ open: false, item: null });
  const [bookViewer, setBookViewer] = useState({ open: false, book: null });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    item: null,
    index: null,
  });
  const [infirmary, setInfirmary] = useState(false);
  const [firestoreItems, setFirestoreItems] = useState([]);

  // Update infirmary state when userData changes
  useEffect(() => {
    if (userData) {
      setInfirmary(userData.infirmaryEnd && userData.infirmaryEnd > Date.now());
    }
  }, [userData]);

  // Fetch firestore items to match images
  useEffect(() => {
    const fetchFirestoreItems = async () => {
      try {
        const snapshot = await getDocs(collection(db, "shopItems"));
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFirestoreItems(items);
      } catch (error) {
        console.error("Error fetching firestore items for images:", error);
      }
    };

    fetchFirestoreItems();
  }, []);

  console.log("Inventory page loaded, inventory:", userData?.inventory || []);

  // Delete item function
  const handleDeleteItem = async () => {
    if (!user || !deleteModal.item) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;

      let inv = userDoc.data().inventory || [];
      const invIdx = inv.findIndex((i) => i.name === deleteModal.item.name);
      if (invIdx === -1) return;

      inv[invIdx].qty = (inv[invIdx].qty || 1) - 1;
      if (inv[invIdx].qty <= 0) {
        inv.splice(invIdx, 1);
      }

      await updateDoc(userRef, { inventory: inv });

      // Clear cache after inventory update
      cacheHelpers.clearUserCache(user.uid);

      // Close modal
      setDeleteModal({ open: false, item: null, index: null });
    } catch (error) {
      console.error("Error deleting item:", error);
      // Close modal even on error
      setDeleteModal({ open: false, item: null, index: null });
    }
  };

  return (
    <div className={styles.inventoryPage}>
      <div className={styles.inventoryContainer}>
        <h1 className={styles.inventoryTitle}>Inventory</h1>
        {Array.isArray(userData?.inventory) && userData.inventory.length > 0 ? (
          <ul className={styles.inventoryList}>
            {userData.inventory.map((item, idx) => {
              // Add image to item if it doesn't have one
              const itemWithImage = addImageToItem(item, firestoreItems);

              // Debug: Log ALL items to see what's in inventory
              console.log("Original item:", item);
              console.log("Item with image:", itemWithImage);
              console.log("Image URL:", itemWithImage.image); // Debug: Log item data
              if (
                itemWithImage.name?.toLowerCase().includes("book") ||
                itemWithImage.type === "book"
              ) {
                console.log("Book item found:", itemWithImage);
              }

              // Mat og potions kan spises/drikkes
              const isEdible =
                itemWithImage.type === "food" ||
                itemWithImage.type === "potion";
              let healAmount = 0;
              const isDeathPotion = itemWithImage.name === "Death Draught";
              if (itemWithImage.name === "Chocolate Frog") healAmount = 15;
              if (itemWithImage.name === "Healing Potion") healAmount = 1000;
              if (
                itemWithImage.type === "food" &&
                typeof itemWithImage.health === "number"
              ) {
                healAmount = itemWithImage.health;
              }

              return (
                <li
                  key={idx}
                  className={styles.inventoryItem}
                  data-item-type={itemWithImage.type}
                >
                  <div className={styles.itemInfo}>
                    {/* Item Image - Always show */}
                    <div className={styles.itemImageContainer}>
                      <img
                        src={
                          itemWithImage.image ||
                          itemWithImage.coverImage ||
                          "./icons/chest.svg"
                        }
                        alt={itemWithImage.name}
                        className={styles.itemImage}
                        onLoad={() =>
                          console.log(
                            "Inventory image loaded for:",
                            itemWithImage.name
                          )
                        }
                        onError={() =>
                          console.log(
                            "Inventory image failed to load for:",
                            itemWithImage.name
                          )
                        }
                      />
                    </div>
                    <div className={styles.itemTextContent}>
                      <span className={styles.itemName}>
                        {itemWithImage.name}
                      </span>{" "}
                      x{itemWithImage.qty || 1}
                      {typeof itemWithImage.health === "number" &&
                        itemWithImage.type === "food" && (
                          <span style={{ color: "#6f6", marginLeft: 6 }}>
                            (+{itemWithImage.health} HP)
                          </span>
                        )}
                    </div>
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
                      onClick={() =>
                        setDeleteModal({
                          open: true,
                          item: itemWithImage,
                          index: idx,
                        })
                      }
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
                          inv[invIdx].qty = (inv[invIdx].qty || 1) - 1;
                          if (inv[invIdx].qty <= 0) inv.splice(invIdx, 1);
                          let update = {
                            inventory: inv,
                            lastHealthUpdate: Date.now(),
                          };
                          const realName =
                            item.originalName || item.realItem || item.name;

                          if (realName === "Death Draught") {
                            update.health = 0;
                            update.infirmaryEnd = Date.now() + 20 * 60 * 1000;
                          } else if (realName === "Healing Potion") {
                            update.health = 100;
                          } else if (realName === "Invisibility Draught") {
                            update.invisibleUntil = Date.now() + 5 * 60 * 1000;
                          } else if (realName === "Love Potion") {
                            let giver = item.giftedBy;
                            if (!giver) {
                              try {
                                const notifQuery = query(
                                  collection(db, "notifications"),
                                  where("to", "==", user.uid),
                                  where("item", "==", item.name),
                                  where("read", "==", false)
                                );
                                const notifSnap = await getDocs(notifQuery);
                                if (!notifSnap.empty) {
                                  const notifDoc = notifSnap.docs
                                    .map((d) => d)
                                    .sort(
                                      (a, b) =>
                                        b.data().created - a.data().created
                                    )[0];
                                  const notif = notifDoc.data();
                                  if (notif && notif.from) {
                                    giver = notif.from;
                                    await updateDoc(
                                      doc(db, "notifications", notifDoc.id),
                                      { read: true }
                                    );
                                  }
                                }
                              } catch (e) {
                                console.error("Error finding notification:", e);
                                giver = "Unknown";
                              }
                            }
                            if (!giver) giver = "Unknown";
                            update.inLoveUntil = Date.now() + 60 * 60 * 1000;
                            update.inLoveWith = giver;
                          } else if (realName === "Hair Color Potion") {
                            update.hairColorUntil =
                              Date.now() + 2 * 60 * 60 * 1000;
                          } else if (realName === "Rainbow Potion") {
                            update.rainbowUntil = Date.now() + 60 * 60 * 1000;
                          } else if (realName === "Glow Potion") {
                            update.glowUntil = Date.now() + 3 * 60 * 60 * 1000;
                          } else if (realName === "Sparkle Potion") {
                            update.sparkleUntil =
                              Date.now() + 2 * 60 * 60 * 1000;
                          } else if (realName === "Translation Potion") {
                            update.translationUntil =
                              Date.now() + 2 * 60 * 60 * 1000;
                          } else if (realName === "Echo Potion") {
                            update.echoUntil = Date.now() + 60 * 60 * 1000;
                          } else if (realName === "Whisper Potion") {
                            update.whisperUntil =
                              Date.now() + 2 * 60 * 60 * 1000;
                          } else if (realName === "Shout Potion") {
                            update.shoutUntil = Date.now() + 15 * 60 * 1000;
                          } else if (realName === "Dark Mode Potion") {
                            update.darkModeUntil =
                              Date.now() + 24 * 60 * 60 * 1000;
                          } else if (realName === "Retro Potion") {
                            update.retroUntil = Date.now() + 2 * 60 * 60 * 1000;
                          } else if (realName === "Mirror Potion") {
                            update.mirrorUntil =
                              Date.now() + 2 * 60 * 60 * 1000;
                          } else if (realName === "Speed Potion") {
                            update.speedUntil = Date.now() + 15 * 60 * 1000;
                          } else if (realName === "Slow Motion Potion") {
                            update.slowMotionUntil =
                              Date.now() + 60 * 60 * 1000;
                          } else if (realName === "Lucky Potion") {
                            update.luckyUntil = Date.now() + 3 * 60 * 60 * 1000;
                          } else if (realName === "Wisdom Potion") {
                            update.wisdomUntil =
                              Date.now() + 2 * 60 * 60 * 1000;
                          } else if (realName === "Surveillance Potion") {
                            update.surveillanceUntil =
                              Date.now() + 60 * 60 * 1000;
                          } else if (realName === "Charm Potion") {
                            update.charmUntil = Date.now() + 2 * 60 * 60 * 1000;
                          } else if (realName === "Mystery Potion") {
                            update.mysteryUntil =
                              Date.now() + 2 * 60 * 60 * 1000;
                          } else {
                            let newHealth = (data.health || 100) + healAmount;
                            if (newHealth > 100) newHealth = 100;
                            update.health = newHealth;
                          }
                          await updateDoc(userRef, update);

                          // Clear cache after user data update
                          cacheHelpers.clearUserCache(user.uid);
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
                    {/* Read button for books - only show if book has proper content */}
                    {item.type === "book" &&
                      item.pages &&
                      Array.isArray(item.pages) &&
                      item.pages.length > 0 && (
                        <button
                          className={styles.readBtn}
                          title="Read this book"
                          onClick={() => {
                            console.log("Read button clicked for:", item);
                            setBookViewer({ open: true, book: item });
                          }}
                          style={{
                            background: "#8B4513",
                            color: "white",
                            border: "2px solid #D4C4A8",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          📖 Read
                        </button>
                      )}
                    {/* Debug: Show item type */}
                    {process.env.NODE_ENV === "development" && (
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#888",
                          marginLeft: "4px",
                        }}
                      >
                        Type: {item.type || "undefined"}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={styles.emptyInventory}>
            <span className={styles.emptyText}>Your inventory is empty</span>
            <p className={styles.emptySubtext}>
              Visit the shop to purchase items or receive gifts from other
              players!
            </p>
          </div>
        )}
      </div>

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

          // Add to recipient
          const toRef = doc(db, "users", toUser.uid);
          const toDoc = await getDoc(toRef);
          let toInv = (toDoc.exists() ? toDoc.data().inventory : []) || [];
          const toIdx = toInv.findIndex(
            (i) => i.name === (disguise?.name || giftModal.item.name)
          );
          const giftedBy =
            user.displayName && user.displayName.trim()
              ? user.displayName
              : user.email || "Unknown";
          if (toIdx === -1) {
            const rawItem = {
              ...giftModal.item,
              name: disguise?.name || giftModal.item.name,
              description: disguise?.description || giftModal.item.description,
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
            if (disguise && disguise.name !== giftModal.item.name) {
              toInv[toIdx].originalName = giftModal.item.name;
              toInv[toIdx].realItem = giftModal.item.name;
            }
            Object.keys(toInv[toIdx]).forEach((key) => {
              if (toInv[toIdx][key] === undefined) delete toInv[toIdx][key];
            });
          }
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
            // Handle error silently
          }
          // Add notification
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
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onConfirm={handleDeleteItem}
        onCancel={() =>
          setDeleteModal({ open: false, item: null, index: null })
        }
        itemName={deleteModal.item?.name}
      />
      {/* Book Viewer Modal */}
      {bookViewer.open && (
        <div className={styles.bookViewerOverlay}>
          <BookViewer
            open={bookViewer.open}
            book={bookViewer.book}
            onClose={() => setBookViewer({ open: false, book: null })}
          />
        </div>
      )}
    </div>
  );
};

export default Inventory;
