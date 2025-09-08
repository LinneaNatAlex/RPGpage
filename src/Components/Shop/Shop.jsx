import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import styles from "./Shop.module.css";

const items = [
  // Food
  {
    id: 20,
    name: "Chocolate Frog",
    price: 30,
    type: "food",
    category: "Food",
    description: "A magical treat that restores 15 health.",
    effect: "+15 health",
  },
  {
    id: 21,
    name: "Pumpkin Pastie",
    price: 25,
    type: "food",
    category: "Food",
    description: "A sweet pumpkin-filled pastry. Restores 10 health.",
    effect: "+10 health",
  },
  {
    id: 22,
    name: "Butterbeer",
    price: 20,
    type: "food",
    category: "Food",
    description: "A frothy drink that restores 8 health.",
    effect: "+8 health",
  },
  // Books
  {
    id: 1,
    name: "Book of Spells",
    price: 120,
    type: "book",
    category: "Books",
  },
  {
    id: 2,
    name: "Advanced Alchemy",
    price: 180,
    type: "book",
    category: "Books",
  },
  {
    id: 3,
    name: "Herbal Lore Compendium",
    price: 150,
    type: "book",
    category: "Books",
  },
  // Potions
  {
    id: 4,
    name: "Healing Potion",
    price: 200,
    type: "potion",
    category: "Potions",
    description:
      "Restores your character's health to full. On the website: Shows a healing animation and a message.",
    effect: "Fully restores health.",
  },
  {
    id: 98,
    name: "Death Draught",
    price: 10,
    type: "potion",
    category: "Potions",
    description:
      "A dangerous potion for testing. Sets your health to 0 instantly.",
    effect: "Sets health to 0 (for testing infirmary)",
  },
  {
    id: 5,
    name: "Invisibility Draught",
    price: 110,
    type: "potion",
    category: "Potions",
    description:
      "Makes you invisible to others for 5 minutes. On the website: You disappear from the online list and your avatar is faded.",
    effect: "Invisible for 5 minutes.",
  },
  // Ingredients (packs and singles)
  {
    id: 6,
    name: "Potion Ingredient Pack",
    price: 80,
    type: "ingredient",
    category: "Ingredients",
    ingredients: [
      "Moonflower Petals",
      "Dragon Scale",
      "Stardust",
      "Mandrake Root",
      "Phoenix Feather",
      "Silver Leaf",
      "Amber",
      "Troll Berries",
      "Magical Salt",
    ],
  },
  {
    id: 7,
    name: "Moonflower Petals",
    price: 15,
    type: "ingredient",
    category: "Ingredients",
  },
  {
    id: 8,
    name: "Dragon Scale",
    price: 25,
    type: "ingredient",
    category: "Ingredients",
  },
  {
    id: 9,
    name: "Stardust",
    price: 20,
    type: "ingredient",
    category: "Ingredients",
  },
  {
    id: 12,
    name: "Mandrake Root",
    price: 18,
    type: "ingredient",
    category: "Ingredients",
  },
  {
    id: 13,
    name: "Phoenix Feather",
    price: 30,
    type: "ingredient",
    category: "Ingredients",
  },
  {
    id: 14,
    name: "Silver Leaf",
    price: 12,
    type: "ingredient",
    category: "Ingredients",
  },
  {
    id: 15,
    name: "Amber",
    price: 10,
    type: "ingredient",
    category: "Ingredients",
  },
  {
    id: 16,
    name: "Troll Berries",
    price: 14,
    type: "ingredient",
    category: "Ingredients",
  },
  {
    id: 17,
    name: "Magical Salt",
    price: 8,
    type: "ingredient",
    category: "Ingredients",
  },
  // Equipment
  {
    id: 10,
    name: "Cauldron",
    price: 200,
    type: "equipment",
    category: "Equipment",
  },
  {
    id: 11,
    name: "Crystal Wand",
    price: 300,
    type: "equipment",
    category: "Equipment",
  },
];

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
