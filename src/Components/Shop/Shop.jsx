import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import styles from "./Shop.module.css";
import shopItems from "./itemsList";

const items = shopItems;

const categories = ["Books", "Potions", "Ingredients", "Equipment", "Food"];

const Shop = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("Books");

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
      const existingIdx = inventory.findIndex((i) => i.id === item.id);
      if (existingIdx > -1) {
        inventory[existingIdx].qty = (inventory[existingIdx].qty || 1) + 1;
      } else {
        inventory.push({ ...item, qty: 1 });
      }
    }
    await updateDoc(userRef, { currency: newBalance, inventory });
    setBalance(newBalance);
    setMessage(`You bought ${item.name} for ${item.price} Nits!`);
  };

  if (loading) return <div>Loading shop...</div>;

  return (
    <div className={styles.shopWrapper}>
      <h2>School Shop</h2>
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
        {items
          .filter((item) => item.category === activeCategory)
          .map((item) => (
            <li key={item.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                {item.ingredients && (
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
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Shop;
