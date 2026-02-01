import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default function AgeVerificationAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleApprove = async () => {
    if (!selected) return;
    await updateDoc(doc(db, "users", selected.id), { ageVerified: true });
    setUsers((prev) =>
      prev.map((u) => (u.id === selected.id ? { ...u, ageVerified: true } : u))
    );
    setStatus(`Approved 18+ access for ${selected.displayName || selected.id}`);
    setSelected(null);
  };

  const handleRemove = async () => {
    if (!selected) return;
    await updateDoc(doc(db, "users", selected.id), { ageVerified: false });
    setUsers((prev) =>
      prev.map((u) => (u.id === selected.id ? { ...u, ageVerified: false } : u))
    );
    setStatus(`Removed 18+ access for ${selected.displayName || selected.id}`);
    setSelected(null);
  };

  const all = users;
  if (loading) return <div>Loading users...</div>;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        background: "#F5EFE0",
        color: "#2C2C2C",
        padding: 24,
        borderRadius: 12,
        border: "2px solid #D4C4A8",
      }}
    >
      <h2>18+ Forum Access – Admin</h2>
      <p style={{ color: "#7B6857", marginBottom: 24 }}>
        Approve or remove users for access to the 18+ forum. Only users who have
        been verified on Discord should be approved.
      </p>
      {all.length === 0 ? (
        <div>No users found.</div>
      ) : (
        <>
          <label htmlFor="age-verification-select-user" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Select user
          </label>
          <select
            id="age-verification-select-user"
            name="ageVerificationUser"
            value={selected ? selected.id : ""}
            onChange={(e) => {
              const user = all.find((u) => u.id === e.target.value);
              setSelected(user || null);
              setStatus("");
            }}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              marginBottom: 16,
            }}
          >
            <option value="">Select user...</option>
            {all.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName || user.email || user.id}{" "}
                {user.ageVerified ? "(18+ access)" : ""}
              </option>
            ))}
          </select>
          {selected && (
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}>
                <b>User:</b>{" "}
                {selected.displayName || selected.email || selected.id}
              </div>
              {!selected.ageVerified ? (
                <button
                  onClick={handleApprove}
                  style={{
                    background: "#a084e8",
                    color: "#23232b",
                    fontWeight: 700,
                    border: 0,
                    borderRadius: 6,
                    padding: "6px 18px",
                    cursor: "pointer",
                  }}
                >
                  Approve 18+ Access
                </button>
              ) : (
                <button
                  onClick={handleRemove}
                  style={{
                    background: "#e53935",
                    color: "#fff",
                    fontWeight: 700,
                    border: 0,
                    borderRadius: 6,
                    padding: "6px 18px",
                    cursor: "pointer",
                  }}
                >
                  Remove 18+ Access
                </button>
              )}
            </div>
          )}
        </>
      )}
      {status && (
        <div style={{ color: "#ffd86b", marginTop: 16 }}>{status}</div>
      )}
    </div>
  );
}
