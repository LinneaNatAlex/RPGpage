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
} from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import styles from "./Shop.module.css";
import shopItems from "./itemsList";

// itemsList.js varer + Firestore varer vises sammen

const categories = ["Books", "Potions", "Ingredients", "Equipment", "Food"];

const Shop = () => {
  const { user } = useAuth();
  // Sjekk om bruker er admin (for enkelhets skyld, bruk roller fra user-objekt hvis tilgjengelig)
  const isAdmin =
    user && (user.roles?.includes("admin") || user.roles?.includes("teacher") || user.roles?.includes("archivist"));
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("Books");
  const [firestoreItems, setFirestoreItems] = useState([]);
  const [books, setBooks] = useState([]);
  
  // Hent varer fra Firestore
  useEffect(() => {
    const q = query(collection(db, "shopItems"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const arr = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        firestore: true,
      }));
      setFirestoreItems(arr);
    });
    return () => unsub();
  }, []);

  // Hent bøker fra Firestore
  useEffect(() => {
    const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const arr = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        firestore: true,
        category: "Books",
        name: doc.data().title,
        type: "book"
      }));
      setBooks(arr);
    });
    return () => unsub();
  }, []);

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
    if (balance < item.price) {
      setMessage("Not enough Nits!");
      return;
    }
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;
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
    setBalance(newBalance);
    setMessage(`You bought ${item.name} for ${item.price} Nits!`);
  };

  if (loading) return <div>Loading shop...</div>;

  return (
    <div className={styles.shopWrapper}>
      <h2 style={{
        fontFamily: '"Cinzel", serif',
        fontSize: "2.2rem",
        fontWeight: 700,
        letterSpacing: "1.5px",
        textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        marginBottom: "2rem",
        textAlign: "center",
        color: "#F5EFE0"
      }}>School Shop</h2>
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
      {message && <div className={styles.message}>{message}</div>}
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
                      
                      console.log("Attempting to delete:", item);
                      setMessage("Deleting product...");
                      
                      try {
                        const collection = item.type === "book" ? "books" : "shopItems";
                        console.log("Deleting from collection:", collection, "with id:", item.id);
                        
                        await deleteDoc(doc(db, collection, item.id));
                        
                        console.log("Successfully deleted from Firestore");
                        setMessage(`✅ Product "${item.name}" deleted successfully!`);
                      } catch (error) {
                        console.error("Error deleting product:", error);
                        setMessage(`❌ Error deleting product: ${error.message}`);
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
