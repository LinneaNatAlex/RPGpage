import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

export default function OtherInventory({ userId }) {
  const [inventory, setInventory] = useState([]);
  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, "users", userId);
    const unsub = onSnapshot(ref, (snap) => {
      setInventory(snap.exists() ? snap.data().inventory || [] : []);
    });
    return () => unsub();
  }, [userId]);
  return (
    <div
      style={{
        background: "#222",
        color: "#fff",
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
      }}
    >
      <h4>Inventory for user: {userId}</h4>
      {inventory.length === 0 ? (
        <div>Empty</div>
      ) : (
        <ul>
          {inventory.map((item, i) => (
            <li key={i}>
              {item.name} x{item.qty || 1}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
