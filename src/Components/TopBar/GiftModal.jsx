import { useState } from "react";
import styles from "./TopBar.module.css";

export default function GiftModal({ open, onClose, onGift, users, item }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  if (!open) return null;
  const filtered = users.filter(
    (u) =>
      u.displayName &&
      u.displayName.toLowerCase().includes(search.toLowerCase())
  );
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
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={onClose}>Cancel</button>
          <button
            disabled={!selected}
            onClick={() => {
              const user = users.find((u) => u.uid === selected);
              if (user) onGift(user);
            }}
          >
            Send gift
          </button>
        </div>
      </div>
    </div>
  );
}
