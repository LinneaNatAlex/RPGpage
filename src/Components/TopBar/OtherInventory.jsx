import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const POLL_MS = 2 * 60 * 1000;

export default function OtherInventory({ userId }) {
  const [inventory, setInventory] = useState([]);
  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, "users", userId);
    const fetchInv = () => {
      getDoc(ref).then((snap) => {
        setInventory(snap.exists() ? snap.data().inventory || [] : []);
      });
    };
    fetchInv();
    const interval = setInterval(fetchInv, POLL_MS);
    return () => clearInterval(interval);
  }, [userId]);
  return (
    <div
      style={{
        background: "#222",
        color: "#fff",
        padding: 16,
        borderRadius: 0,
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
