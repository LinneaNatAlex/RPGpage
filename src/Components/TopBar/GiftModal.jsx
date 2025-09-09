import { useState } from "react";
import shopItems from "../Shop/itemsList";
import styles from "./TopBar.module.css";

export default function GiftModal({
  open,
  onClose,
  onGift,
  users,
  item,
  inventory,
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [disguise, setDisguise] = useState(null);
  if (!open) return null;
  const filtered = users.filter(
    (u) =>
      u.displayName &&
      u.displayName.toLowerCase().includes(search.toLowerCase())
  );
  // Hvis det er en potion, kun tillat mat og potions som forkledning
  let disguiseOptions;
  if (item.type === "potion") {
    disguiseOptions = shopItems
      .filter(
        (i) =>
          (i.type === "food" || i.type === "potion") && i.name !== item.name
      )
      .map((i) => ({
        name: i.name,
        description: i.description,
        type: i.type,
        category: i.category,
      }));
  } else {
    // For alt annet, tillat alle varer som forkledning
    disguiseOptions = shopItems
      .filter((i) => i.name !== item.name)
      .map((i) => ({
        name: i.name,
        description: i.description,
        type: i.type,
        category: i.category,
      }));
  }
  // Legg til original som default
  disguiseOptions.unshift({
    name: item.name,
    description: item.description,
    type: item.type,
    category: item.category,
  });
  return (
    <div className={styles.giftModalOverlay}>
      <div className={styles.giftModal}>
        <h4>Gift {item.name}</h4>
        <input
          placeholder="Search user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.giftSearch}
        />
        <ul className={styles.giftUserList}>
          {filtered.map((u) => (
            <li
              key={u.uid}
              className={selected === u.uid ? styles.selected : ""}
              onClick={() => setSelected(u.uid)}
            >
              {u.displayName}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12 }}>
          <label>
            Disguise as:
            <select
              value={disguise ? disguise.name : item.name}
              onChange={(e) => {
                const val = e.target.value;
                const found = disguiseOptions.find((opt) => opt.name === val);
                setDisguise(found);
              }}
              style={{ marginLeft: 8 }}
            >
              {disguiseOptions.map((opt) => (
                <option key={opt.name} value={opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={onClose}>Cancel</button>
          <button
            disabled={!selected}
            onClick={() => {
              const user = users.find((u) => u.uid === selected);
              if (user) onGift(user, disguise || disguiseOptions[0]);
            }}
          >
            Send gift
          </button>
        </div>
      </div>
    </div>
  );
}
