import { useState, useEffect } from "react";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  getDocs,
  limit,
} from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import { cacheHelpers } from "../../utils/firebaseCache";
import styles from "./Shop.module.css";
import shopItems from "./itemsList";

// itemsList.js varer + Firestore varer vises sammen

const categories = ["Books", "Potions", "Ingredients", "Equipment", "Food"];

const Shop = ({ open = true }) => {
  // Helper to pay author nits if teacher/archivist/admin
  const payAuthorNits = async (book) => {
    if (!book.authorId || !book.price) return;
    const authorRef = doc(db, "users", book.authorId);
    const authorDoc = await getDoc(authorRef);
    if (!authorDoc.exists()) return;
    const authorData = authorDoc.data();
    const authorRoles = authorData.roles || [];
    if (
      authorRoles.includes("teacher") ||
      authorRoles.includes("archivist") ||
      authorRoles.includes("admin")
    ) {
      const currentNits = authorData.nits || 0;
      await updateDoc(authorRef, { nits: currentNits + book.price });
    }
  };
  const { user } = useAuth();
  // Sjekk om bruker er admin (for enkelhets skyld, bruk roller fra user-objekt hvis tilgjengelig)
  const isAdmin =
    user &&
    (user.roles?.includes("admin") ||
      user.roles?.includes("teacher") ||
      user.roles?.includes("archivist"));
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("Books");
  const [firestoreItems, setFirestoreItems] = useState([]);
  const [books, setBooks] = useState([]);

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
      } catch (error) {
        console.error("Error fetching shop items:", error);
      }
    };

    fetchItems();
    // Refresh every 30 seconds instead of realtime
    const interval = setInterval(fetchItems, 30000);

    return () => clearInterval(interval);
  }, [open]);

  // Hent bøker fra Firestore KUN når Shop er synlig
  useEffect(() => {
    if (!open) return;
    // QUOTA OPTIMIZATION: Limit books to reduce Firebase reads
    const q = query(
      collection(db, "books"),
      orderBy("createdAt", "desc"),
      limit(50) // Limit to 50 newest books
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const arr = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        firestore: true,
        category: "Books",
        name: doc.data().title,
        type: "book",
      }));
      setBooks(arr);
    });
    return () => unsub();
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
      // If buying a book, pay author nits if teacher/archivist
      if (item.type === "book") {
        await payAuthorNits(item);
      }

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
      } else {
        // Finn eksisterende item i inventory basert på id eller navn
        const existingIdx = inventory.findIndex(
          (i) => i.id === item.id || i.name === item.name
        );
        if (existingIdx > -1) {
          inventory[existingIdx].qty = (inventory[existingIdx].qty || 1) + 1;
          // Oppdater alle relevante felter hvis de mangler (f.eks. type, health)
          inventory[existingIdx] = { ...item, qty: inventory[existingIdx].qty };
        } else {
          // Legg til ALLE felter fra item (også type, health, osv.)
          const newItem = { ...item, qty: 1 };
          console.log("Adding item to inventory:", newItem);
          inventory.push(newItem);
        }
      }

      await updateDoc(userRef, { currency: newBalance, inventory });

      // Clear cache after successful purchase to force UI update
      cacheHelpers.clearUserCache(user.uid);

      setBalance(newBalance);
      setSuccessMessage(
        `✅ Successfully bought ${item.name} for ${item.price} Nits!`
      );

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error buying item:", error);
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
        {categories.map((cat) => (
          <button
            key={cat}
            className={cat === activeCategory ? styles.activeTab : styles.tab}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
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
            borderRadius: "12px",
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
          ✅ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
            color: "#fff",
            padding: "15px 25px",
            borderRadius: "12px",
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
          .filter((item) => item.category === activeCategory)
          .map((item) => (
            <li
              key={item.id + (item.firestore ? "-fs" : "-static")}
              className={styles.item}
            >
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                {item.ingredients && Array.isArray(item.ingredients) && (
                  <span className={styles.ingredients}>
                    [Includes: {item.ingredients.join(", ")}]
                  </span>
                )}
                {item.description && (
                  <span className={styles.itemDesc}>{item.description}</span>
                )}
                {item.effect && (
                  <span className={styles.itemEffect}>
                    <strong>Effect:</strong> {item.effect}
                  </span>
                )}
                {typeof item.health === "number" && item.health > 0 && (
                  <span className={styles.itemEffect}>
                    <strong>HP:</strong> +{item.health}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "0.7rem",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "1.08rem",
                    color: "#fff",
                  }}
                >
                  {item.price} Nits
                </span>
                <button onClick={() => handleBuy(item)}>Buy</button>
                {/* Slett-knapp for Firestore-varer, kun for admin/teacher */}
                {item.firestore && isAdmin && (
                  <button
                    style={{
                      marginTop: 6,
                      background: "#c44",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "0.3rem 0.7rem",
                      cursor: "pointer",
                    }}
                    onClick={async () => {
                      if (!window.confirm(`Slette produktet "${item.name}"?`))
                        return;

                      // Clear previous messages
                      setSuccessMessage("");
                      setErrorMessage("");

                      try {
                        const collection =
                          item.type === "book" ? "books" : "shopItems";

                        await deleteDoc(doc(db, collection, item.id));

                        setSuccessMessage(
                          `✅ Product "${item.name}" deleted successfully!`
                        );
                        setTimeout(() => setSuccessMessage(""), 5000);
                      } catch (error) {
                        console.error("Error deleting product:", error);
                        setErrorMessage(
                          `Failed to delete product: ${error.message}`
                        );
                        setTimeout(() => setErrorMessage(""), 5000);
                      }
                    }}
                  >
                    Slett
                  </button>
                )}
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Shop;
