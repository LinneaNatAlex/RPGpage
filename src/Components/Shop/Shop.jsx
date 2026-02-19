import { useState, useEffect } from "react";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  orderBy,
  deleteDoc,
  getDocs,
  limit,
  arrayUnion,
  arrayRemove,
  addDoc,
} from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import { cacheHelpers } from "../../utils/firebaseCache";
import { addImageToItem } from "../../utils/itemImages";
import styles from "./Shop.module.css";
import shopItems from "./itemsList";
import useUserData from "../../hooks/useUserData";
import useUserRoles from "../../hooks/useUserRoles";

// Static items + Firestore items displayed together

const categories = [
  "Books",
  "Potions",
  "Ingredients",
  "Equipment",
  "Food",
  "Pets",
  "Pet Items",
];

const shortCategoryLabels = {
  Equipment: "Equip",
  "Pet Items": "Pet it.",
  Ingredients: "Ingr.",
};

const Shop = ({ open = true }) => {
  // Books use display names only - no author payments
  const { user } = useAuth();
  const { userData } = useUserData();
  const { roles } = useUserRoles();
  // Potions/Ingredients synlig for alle. Kun admin/headmaster/professor/teacher kan kjøpe potions uten å ha brygget dem (canAccessPotionsCategory).
  const canAccessPotionsCategory =
    user &&
    (roles?.some((r) => String(r).toLowerCase() === "admin") ||
      roles?.some((r) => String(r).toLowerCase() === "headmaster") ||
      roles?.some((r) => String(r).toLowerCase() === "professor") ||
      roles?.some((r) => String(r).toLowerCase() === "teacher"));
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("Books");
  const shopCategories = categories;
  useEffect(() => {
    if (!shopCategories.includes(activeCategory)) {
      setActiveCategory(shopCategories[0] || "Books");
    }
  }, [shopCategories, activeCategory]);
  const [firestoreItems, setFirestoreItems] = useState([]);
  const [books, setBooks] = useState([]);
  const [narrowScreen, setNarrowScreen] = useState(
    typeof window !== "undefined" && window.innerWidth <= 480
  );

  useEffect(() => {
    const onResize = () => setNarrowScreen(window.innerWidth <= 480);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleBookLike = async (bookItem) => {
    if (!user || bookItem.type !== "book") return;
    const authorUid = bookItem.createdBy || bookItem.authorUid;
    const likedBy = Array.isArray(bookItem.likedBy) ? bookItem.likedBy : [];
    const hasLiked = likedBy.includes(user.uid);
    const bookRef = doc(db, "books", bookItem.id);
    try {
      if (hasLiked) {
        await updateDoc(bookRef, { likedBy: arrayRemove(user.uid) });
        setBooks((prev) =>
          prev.map((b) =>
            b.id === bookItem.id
              ? { ...b, likedBy: (b.likedBy || []).filter((uid) => uid !== user.uid) }
              : b
          )
        );
      } else {
        await updateDoc(bookRef, { likedBy: arrayUnion(user.uid) });
        setBooks((prev) =>
          prev.map((b) =>
            b.id === bookItem.id ? { ...b, likedBy: [...(b.likedBy || []), user.uid] } : b
          )
        );
        if (authorUid && authorUid !== user.uid) {
          const likerName = user.displayName?.trim() || user.email || "Someone";
          await addDoc(collection(db, "notifications"), {
            to: authorUid,
            type: "content_like",
            from: user.uid,
            fromUid: user.uid,
            fromName: likerName,
            targetType: "book",
            targetId: bookItem.id,
            targetTitle: bookItem.title || "your book",
            read: false,
            created: Date.now(),
          });
        }
      }
    } catch (err) {}
  };

  // Get brewed potions for unlock system
  const [craftedPotions, setCraftedPotions] = useState(new Set());

  // Load crafted potions from user data
  useEffect(() => {
    if (userData?.craftedPotions) {
      setCraftedPotions(new Set(userData.craftedPotions));
    }
  }, [userData]);

  // Hent varer fra Firestore KUN når Shop er synlig - OPTIMIZED
  useEffect(() => {
    if (!open) return;

    // Use getDocs instead of onSnapshot to reduce quota usage
    const fetchItems = async () => {
      try {
        const q = query(
          collection(db, "shopItems"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const arr = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          firestore: true,
        }));
        setFirestoreItems(arr);
      } catch (error) {}
    };

    fetchItems();
    // Refresh every 30 seconds instead of realtime
    const interval = setInterval(fetchItems, 30000);

    return () => clearInterval(interval);
  }, [open]);

  // Hent bøker fra Firestore KUN når Shop er synlig
  useEffect(() => {
    if (!open) return;

    const fetchBooks = async () => {
      try {
        // QUOTA OPTIMIZATION: Limit books to reduce Firebase reads
        const q = query(
          collection(db, "books"),
          orderBy("createdAt", "desc"),
          limit(50) // Limit to 50 newest books
        );
        const snapshot = await getDocs(q);
        const arr = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          firestore: true,
          category: "Books",
          name: doc.data().title,
          type: "book",
        }));
        setBooks(arr);
      } catch (error) {}
    };

    fetchBooks();
  }, [open]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setBalance(data.currency ?? 1000);
      }
      setLoading(false);
    };
    fetchBalance();
  }, [user]);

  const handleBuy = async (item) => {
    // Clear previous messages
    setSuccessMessage("");
    setErrorMessage("");

    if (balance < item.price) {
      setErrorMessage(
        `Not enough Nits! You need ${item.price} Nits but only have ${balance}.`
      );
      // Clear error message after 5 seconds
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        setErrorMessage("User data not found!");
        setTimeout(() => setErrorMessage(""), 5000);
        return;
      }

      const data = userDoc.data();
      const newBalance = (data.currency ?? 1000) - item.price;
      // Inventory logic
      let inventory = data.inventory ?? [];
      // If buying an ingredient pack, add all ingredients as separate items
      if (
        item.name === "Potion Ingredient Pack" &&
        Array.isArray(item.ingredients)
      ) {
        item.ingredients.forEach((ing) => {
          const ingIdx = inventory.findIndex((i) => i.name === ing);
          if (ingIdx > -1) {
            inventory[ingIdx].qty = (inventory[ingIdx].qty || 1) + 1;
          } else {
            inventory.push({ name: ing, qty: 1, type: "ingredient" });
          }
        });
      } else if (item.category === "Pets") {
        // Special handling for pets - user can only have one pet at a time
        const itemWithImage = addImageToItem(item);

        // Check if user already has a pet
        const existingPetIdx = inventory.findIndex(
          (i) => i.category === "Pets"
        );

        if (existingPetIdx > -1) {
          setErrorMessage(
            `You already have a pet: ${inventory[existingPetIdx].name}. You can only have one pet at a time!`
          );
          setTimeout(() => setErrorMessage(""), 5000);
          return;
        }

        // Add pet to inventory and set as current pet
        const newPet = { ...itemWithImage, qty: 1 };
        inventory.push(newPet);

        // Set as current pet in user profile with lastFed timestamp
        const petWithTimestamp = {
          ...itemWithImage,
          lastFed: new Date(), // Pet starts at full HP
          customName: null, // Will be set later by user
        };

        await updateDoc(userRef, {
          currency: newBalance,
          inventory,
          currentPet: petWithTimestamp,
        });
      } else {
        // Finn eksisterende item i inventory basert på id eller navn
        const existingIdx = inventory.findIndex(
          (i) => i.id === item.id || i.name === item.name
        );
        if (existingIdx > -1) {
          inventory[existingIdx].qty = (inventory[existingIdx].qty || 1) + 1;
          // Oppdater alle relevante felter hvis de mangler (f.eks. type, health, image)
          const itemWithImage = addImageToItem(item);
          inventory[existingIdx] = {
            ...itemWithImage,
            qty: inventory[existingIdx].qty,
          };
        } else {
          // Legg til ALLE felter fra item (også type, health, osv.)
          const itemWithImage = addImageToItem(item);
          const newItem = { ...itemWithImage, qty: 1 };
          inventory.push(newItem);
        }
      }

      // Update user document with new balance and inventory
      const updateData = { currency: newBalance, inventory };

      await updateDoc(userRef, updateData);

      // Clear cache after successful purchase to force UI update
      cacheHelpers.clearUserCache(user.uid);

      setBalance(newBalance);
      setSuccessMessage(
        `Successfully bought ${item.name} for ${item.price} Nits!`
      );

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      setErrorMessage(`Failed to purchase ${item.name}: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  if (loading) return <div>Loading shop...</div>;

  return (
    <div className={styles.shopWrapper}>
      <h2
        style={{
          fontFamily: '"Cinzel", serif',
          fontSize: "2.2rem",
          fontWeight: 700,
          letterSpacing: "1.5px",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          marginBottom: "2rem",
          textAlign: "center",
          color: "#F5EFE0",
        }}
      >
        School Shop
      </h2>
      <div className={styles.balance}>Balance: {balance} Nits</div>
      <div className={styles.tabs}>
        {shopCategories.map((cat) => (
          <button
            key={cat}
            className={cat === activeCategory ? styles.activeTab : styles.tab}
            onClick={() => setActiveCategory(cat)}
            title={cat}
          >
            {narrowScreen && shortCategoryLabels[cat] ? shortCategoryLabels[cat] : cat}
          </button>
        ))}
      </div>

      {/* Success and Error Messages - positioned right above product list */}
      {successMessage && (
        <div
          style={{
            background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
            color: "#fff",
            padding: "15px 25px",
            borderRadius: 0,
            marginBottom: "25px",
            marginTop: "20px",
            textAlign: "center",
            fontSize: "1.2rem",
            fontWeight: "600",
            boxShadow: "0 6px 20px rgba(76, 175, 80, 0.4)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            position: "relative",
            zIndex: "10",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
            color: "#fff",
            padding: "15px 25px",
            borderRadius: 0,
            marginBottom: "25px",
            marginTop: "20px",
            textAlign: "center",
            fontSize: "1.2rem",
            fontWeight: "600",
            boxShadow: "0 6px 20px rgba(244, 67, 54, 0.4)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            position: "relative",
            zIndex: "10",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          ❌ {errorMessage}
        </div>
      )}

      <ul className={styles.itemList}>
        {[...shopItems, ...firestoreItems, ...books]
          .filter((item) => {
            // Filtrer ut statiske produkter som er konvertert til Firestore
            if (item.firestore) return true; // Firestore-produkter vises alltid
            if (item.type === "book") return true; // Bøker vises alltid

            // For statiske produkter, sjekk om de er konvertert
            const isConverted = firestoreItems.some(
              (fsItem) =>
                fsItem.originalId === item.id ||
                (fsItem.name === item.name && fsItem.category === item.category)
            );

            return !isConverted; // Vis kun ikke-konverterte statiske produkter
          })
          .filter((item) => {
            // First check category
            if (item.category !== activeCategory) return false;

            // For potions, show all items (locked if not crafted)
            if (item.category === "Potions") {
              return true; // Show all potions, ingredients, and equipment
            }

            // For other categories, show all items
            return true;
          })
          .map((item) => {
            const itemWithImage = addImageToItem(item);

            // Check if potion is locked (not crafted) – kun admin/headmaster/teacher kan kjøpe uten å ha brygget
            const isPotionLocked =
              !canAccessPotionsCategory &&
              item.category === "Potions" &&
              item.type === "potion" &&
              !craftedPotions.has(item.name);

            return (
              <li
                key={
                  itemWithImage.id +
                  (itemWithImage.firestore ? "-fs" : "-static")
                }
                className={`${styles.item} ${
                  isPotionLocked ? styles.lockedItem : ""
                }`}
              >
                <div className={styles.itemInfo}>
                  {/* Bilde + tittel på én rad */}
                  {(itemWithImage.image || itemWithImage.coverImage) && (
                    <div className={styles.itemImageContainer}>
                      <img
                        src={itemWithImage.image || itemWithImage.coverImage}
                        alt={itemWithImage.name}
                        className={styles.itemImage}
                        onLoad={() => {}}
                        onError={() => {}}
                        style={{
                          border: "2px solid #7B6857",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                      />
                    </div>
                  )}
                  <span className={styles.itemName}>
                    {itemWithImage.name}
                  </span>
                </div>
                {/* Beskrivelse og effekt under bilde/tittel – full bredde */}
                <div className={styles.itemDetails}>
                  {itemWithImage.ingredients &&
                    Array.isArray(itemWithImage.ingredients) && (
                      <span className={styles.ingredients}>
                        [Includes: {itemWithImage.ingredients.join(", ")}]
                      </span>
                    )}
                  {itemWithImage.description && (
                    <span className={styles.itemDesc}>
                      {itemWithImage.description}
                    </span>
                  )}
                  {itemWithImage.effect && (
                    <span className={styles.itemEffect}>
                      <strong>Effect:</strong> {itemWithImage.effect}
                    </span>
                  )}
                  {typeof itemWithImage.health === "number" &&
                    itemWithImage.health > 0 && (
                      <span className={styles.itemEffect}>
                        <strong>HP:</strong> +{itemWithImage.health}
                      </span>
                    )}
                </div>
                <div className={styles.itemActions}>
                  <span className={styles.itemPrice}>
                    {itemWithImage.price} Nits
                  </span>
                  <div className={styles.itemButtons}>
                    {isPotionLocked ? (
                      <button
                        disabled
                        style={{
                          background: "#666",
                          color: "#ccc",
                          cursor: "not-allowed",
                          opacity: 0.6,
                        }}
                      >
                        🔒 Locked - Craft First
                      </button>
                    ) : (
                      <button onClick={() => handleBuy(itemWithImage)}>
                        Buy
                      </button>
                    )}
                    {/* Delete button for Firestore items (admin/headmaster/professor) */}
                    {itemWithImage.firestore && canAccessPotionsCategory && (
                      <button
                        className={styles.deleteBtn}
                        onClick={async () => {
                        if (
                          window.confirm(
                            `Delete the product "${itemWithImage.name}"?`
                          )
                        ) {
                          // Clear previous messages
                          setSuccessMessage("");
                          setErrorMessage("");

                          try {
                            const collection =
                              itemWithImage.type === "book"
                                ? "books"
                                : "shopItems";

                            await deleteDoc(
                              doc(db, collection, itemWithImage.id)
                            );

                            setSuccessMessage(
                              `✅ Product "${itemWithImage.name}" deleted successfully!`
                            );
                            setTimeout(() => setSuccessMessage(""), 5000);
                          } catch (error) {
                            setErrorMessage(
                              `Failed to delete product: ${error.message}`
                            );
                            setTimeout(() => setErrorMessage(""), 5000);
                          }
                        }
                      }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  {itemWithImage.type === "book" && (
                    <div className={styles.bookLikeRow}>
                      <button
                        type="button"
                        className={styles.bookLikeButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookLike(itemWithImage);
                        }}
                        title={(Array.isArray(itemWithImage.likedBy) && itemWithImage.likedBy.includes(user?.uid)) ? "Unlike" : "Like"}
                        aria-label={(Array.isArray(itemWithImage.likedBy) && itemWithImage.likedBy.includes(user?.uid)) ? "Unlike" : "Like"}
                      >
                        {(Array.isArray(itemWithImage.likedBy) && itemWithImage.likedBy.includes(user?.uid)) ? "❤️" : "🤍"}
                      </button>
                      {Array.isArray(itemWithImage.likedBy) && itemWithImage.likedBy.length > 0 && (
                        <span className={styles.bookLikeCount}>{itemWithImage.likedBy.length}</span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default Shop;
