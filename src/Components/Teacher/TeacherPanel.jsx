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
        maxWidth: 600,
        margin: "2rem auto",
        background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
        color: "#F5EFE0",
        padding: 40,
        borderRadius: 20,
        boxShadow: "0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)",
        border: "3px solid #7B6857",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #D4C4A8 0%, #7B6857 50%, #D4C4A8 100%)",
          borderRadius: "20px 20px 0 0",
        }}
      />
      <h2 style={{
        fontFamily: '"Cinzel", serif',
        fontSize: "2.2rem",
        fontWeight: 700,
        letterSpacing: "1.5px",
        textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        marginBottom: "2rem",
        textAlign: "center"
      }}>Teacher Panel</h2>
      
      <div style={{ 
        marginBottom: 20,
        background: "rgba(245, 239, 224, 0.1)",
        padding: 20,
        borderRadius: 12,
        border: "2px solid rgba(255, 255, 255, 0.2)"
      }}>
        <label style={{
          color: "#D4C4A8",
          fontSize: "1.1rem",
          fontWeight: 600,
          fontFamily: '"Cinzel", serif',
          display: "block",
          marginBottom: 12
        }}>Select User:</label>
        <select
          onChange={(e) =>
            setSelected(users.find((u) => u.uid === e.target.value))
          }
          value={selected?.uid || ""}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            background: "#F5EFE0",
            color: "#2C2C2C",
            border: "2px solid #D4C4A8",
            fontSize: "1rem",
            fontWeight: 600
          }}
        >
          <option value="">Choose user</option>
          {users.map((u) => (
            <option key={u.uid} value={u.uid}>
              {u.displayName || u.email}
            </option>
          ))}
        </select>
      </div>
      
      {selected && (
        <div style={{ 
          marginBottom: 20,
          background: "rgba(245, 239, 224, 0.1)",
          padding: 20,
          borderRadius: 12,
          border: "2px solid rgba(255, 255, 255, 0.2)"
        }}>
          <label style={{
            color: "#D4C4A8",
            fontSize: "1.1rem",
            fontWeight: 600,
            fontFamily: '"Cinzel", serif',
            display: "block",
            marginBottom: 12
          }}>Points to give:</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ 
                width: 100,
                padding: "12px 16px",
                borderRadius: 8,
                background: "#F5EFE0",
                color: "#2C2C2C",
                border: "2px solid #D4C4A8",
                fontSize: "1rem",
                fontWeight: 600
              }}
            />
            <button 
              onClick={handleGivePoints} 
              style={{
                background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 12,
                padding: "12px 24px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
              }}
            >
              Give Points
            </button>
          </div>
        </div>
      )}
      
      {status && (
        <div style={{ 
          color: "#D4C4A8", 
          marginTop: 20,
          padding: 16,
          background: "rgba(212, 196, 168, 0.1)",
          borderRadius: 12,
          border: "1px solid rgba(212, 196, 168, 0.3)",
          fontSize: "1.1rem",
          textAlign: "center",
          fontWeight: 600
        }}>
          {status}
        </div>
      )}
    </div>
  );
}
