import { useState } from "react";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import useUsers from "../../hooks/useUser";
import firebase from "firebase/compat/app";

export default function AdminPanel() {
  const { users } = useUsers();
  const { user } = useAuth();
  const { roles = [] } = useUserRoles();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState("");

  const [pointsUser, setPointsUser] = useState("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsMessage, setPointsMessage] = useState("");

  const filtered = users.filter(
    (u) =>
      (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleNitsChange(delta) {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setStatus("Bare admin kan endre Nits.");
      return;
    }
    setStatus("Working...");
    const ref = doc(db, "users", selected.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return setStatus("User not found");
    const data = snap.data();
    const newNits = (data.currency || 0) + delta;
    await updateDoc(ref, { currency: newNits });
    setStatus(`Nits updated: ${newNits}`);
  }

  const handlePointsUpdate = async () => {
    setPointsMessage("");
    if (!pointsUser || !pointsAmount) {
      setPointsMessage("Please enter username and points");
      return;
    }
    try {
      // Finn bruker i users-arrayen
      const user = users.find(
        (u) =>
          (u.displayName &&
            u.displayName.toLowerCase() === pointsUser.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === pointsUser.toLowerCase())
      );
      if (!user) {
        setPointsMessage("Fant ikke bruker");
        return;
      }
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        points: increment(Number(pointsAmount)),
      });
      setPointsMessage("Points updated!");
    } catch (err) {
      setPointsMessage("Feil: " + err.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "2rem auto",
        background: "#23232b",
        color: "#fff",
        padding: 24,
        borderRadius: 12,
      }}
    >
      <h2>Admin Panel</h2>
      <input
        placeholder="Search user..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 8, padding: 6, borderRadius: 6 }}
      />
      <ul style={{ maxHeight: 120, overflowY: "auto", marginBottom: 8 }}>
        {filtered.map((u) => (
          <li
            key={u.uid}
            style={{
              cursor: "pointer",
              background: selected?.uid === u.uid ? "#a084e8" : "#23232b",
              color: selected?.uid === u.uid ? "#23232b" : "#fff",
              padding: 6,
              borderRadius: 6,
              marginBottom: 2,
            }}
            onClick={() => {
              setSelected(u);
              setPointsUser(u.displayName || u.email || "");
            }}
          >
            {u.displayName || u.email || u.uid} ({u.currency ?? 0} nits)
          </li>
        ))}
      </ul>
      {selected && roles.includes("admin") && (
        <div style={{ marginBottom: 12 }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: 80, marginRight: 8 }}
          />
          <button
            onClick={() => handleNitsChange(amount)}
            style={{ marginRight: 8 }}
          >
            + Nits
          </button>
          <button onClick={() => handleNitsChange(-amount)}>- Nits</button>
        </div>
      )}
      {status && <div style={{ color: "#ff0", marginTop: 8 }}>{status}</div>}

      {/* Points management section */}
      {(roles.includes("admin") || roles.includes("teacher")) && (
        <div className="admin-section">
          <h3>Add / subtract points</h3>
          <input
            type="text"
            placeholder="Brukernavn eller e-post"
            value={pointsUser}
            onChange={(e) => setPointsUser(e.target.value)}
          />
          <input
            type="number"
            placeholder="Number of points (+/-)"
            value={pointsAmount}
            onChange={(e) => setPointsAmount(e.target.value)}
          />
          <button onClick={handlePointsUpdate}>Update points</button>
          {pointsMessage && (
            <div
              className="admin-message"
              style={{ color: "#ff0", marginTop: 8 }}
            >
              {pointsMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
