import { useState } from "react";
import useUsers from "../../hooks/useUser";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function TeacherPanel() {
  const { users } = useUsers();
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState(1);
  const [status, setStatus] = useState("");

  async function handleGivePoints() {
    if (!selected) return;
    setStatus("Arbeider...");
    const ref = doc(db, "users", selected.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return setStatus("Bruker ikke funnet");
    const data = snap.data();
    const newPoints = (data.points || 0) + amount;
    await updateDoc(ref, { points: newPoints });
    setStatus(`Points updated: ${newPoints}`);
  }

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "2rem auto",
        background: "#23232b",
        color: "#fff",
        padding: 24,
        borderRadius: 12,
      }}
    >
      <h2>Teacher Panel</h2>
      <div style={{ marginBottom: 12 }}>
        <select
          onChange={(e) =>
            setSelected(users.find((u) => u.uid === e.target.value))
          }
          value={selected?.uid || ""}
        >
          <option value="">Velg bruker</option>
          {users.map((u) => (
            <option key={u.uid} value={u.uid}>
              {u.displayName || u.email}
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <div style={{ marginBottom: 12 }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: 80, marginRight: 8 }}
          />
          <button onClick={handleGivePoints} style={{ marginRight: 8 }}>
            Give points
          </button>
        </div>
      )}
      {status && <div style={{ color: "#ff0", marginTop: 8 }}>{status}</div>}
    </div>
  );
}
