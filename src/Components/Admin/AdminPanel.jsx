import { useState } from "react";
import { useAuth } from "../../context/authContext";
import useUserRoles from "../../hooks/useUserRoles";
import { db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import useUsers from "../../hooks/useUser";
import firebase from "firebase/compat/app";
import AgeVerificationAdmin from "../Forum/AgeVerificationAdmin";
import ShopProductAdmin from "./ShopProductAdmin";

export default function AdminPanel() {
  const { users } = useUsers();
  const { user } = useAuth();
  const { roles = [] } = useUserRoles();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState("");

  // Suspension/ban/IP-ban state
  const [suspendHours, setSuspendHours] = useState(0);
  const [suspendMinutes, setSuspendMinutes] = useState(0);
  const [banStatus, setBanStatus] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [ipBanStatus, setIpBanStatus] = useState("");
  const [showBanned, setShowBanned] = useState(false);

  const [pointsUser, setPointsUser] = useState("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsMessage, setPointsMessage] = useState("");

  const filtered = users.filter(
    (u) =>
      (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // Banned users/IPs
  const bannedUsers = users.filter((u) => u.banned || u.bannedIp);

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

  // Pause user for X days
  async function handleSuspendUser() {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setStatus("Only admin can suspend users.");
      return;
    }
    setStatus("Working...");
    const ref = doc(db, "users", selected.uid);
    const totalMs =
      (Number(suspendHours) * 60 + Number(suspendMinutes)) * 60 * 1000;
    const until = totalMs > 0 ? Date.now() + totalMs : null;
    // Hent eksisterende antall suspensjoner
    let suspCount = selected.suspensionCount || 0;
    if (until) suspCount++;
    await updateDoc(ref, {
      pausedUntil: until,
      suspendReason: suspendReason || null,
      suspensionCount: suspCount,
    });
    setStatus(
      `User suspended until ${
        until ? new Date(until).toLocaleString() : "cleared"
      }`
    );
  }

  // Ban user
  async function handleBanUser() {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setBanStatus("Bare admin kan banne brukere.");
      return;
    }
    setBanStatus("Working...");
    const ref = doc(db, "users", selected.uid);
    await updateDoc(ref, { banned: true });
    setBanStatus("User banned.");
  }

  // Unban user
  async function handleUnbanUser() {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setBanStatus("Bare admin kan oppheve ban.");
      return;
    }
    setBanStatus("Working...");
    const ref = doc(db, "users", selected.uid);
    await updateDoc(ref, { banned: false });
    setBanStatus("User unbanned.");
  }

  // Ban IP
  async function handleBanIp(ip) {
    if (!ip) return;
    setIpBanStatus("Working...");
    // Ban all users with this IP
    const affected = users.filter((u) => u.ipAddress === ip);
    for (const u of affected) {
      await updateDoc(doc(db, "users", u.uid), { bannedIp: true });
    }
    setIpBanStatus(`IP ${ip} banned for all users.`);
  }

  // Unban IP
  async function handleUnbanIp(ip) {
    if (!ip) return;
    setIpBanStatus("Working...");
    const affected = users.filter((u) => u.ipAddress === ip);
    for (const u of affected) {
      await updateDoc(doc(db, "users", u.uid), { bannedIp: false });
    }
    setIpBanStatus(`IP ${ip} unbanned for all users.`);
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
      // Tøm feltene etter vellykket oppdatering
      setPointsUser("");
      setPointsAmount("");
    } catch (err) {
      setPointsMessage("Feil: " + err.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: 800,
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
      }}>Admin Panel</h2>
      {(roles.includes("admin") || roles.includes("teacher")) && <ShopProductAdmin />}
      <button
        onClick={() => setShowBanned((v) => !v)}
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
          letterSpacing: "0.5px",
          marginBottom: 20
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
        {showBanned ? "Hide banned users/IPs" : "Show banned users/IPs"}
      </button>
      {showBanned && (
        <div
          style={{
            background: "rgba(245, 239, 224, 0.1)",
            padding: 20,
            borderRadius: 16,
            marginBottom: 24,
            border: "2px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3 style={{
            color: "#D4C4A8",
            fontSize: "1.3rem",
            fontFamily: '"Cinzel", serif',
            fontWeight: 600,
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            marginBottom: 16
          }}>Banned users & IPs</h3>
          <ul style={{ maxHeight: 100, overflowY: "auto" }}>
            {bannedUsers.length === 0 && <li>No banned users/IPs.</li>}
            {bannedUsers.map((u) => (
              <li key={u.uid}>
                {u.displayName || u.email || u.uid} {u.banned && "(banned)"}{" "}
                {u.bannedIp && "(IP banned)"}
                <br />
                IP: {u.ipAddress || "unknown"}
                {u.ipAddress && (
                  <>
                    {!u.bannedIp ? (
                      <button
                        style={{ marginLeft: 8 }}
                        onClick={() => handleBanIp(u.ipAddress)}
                      >
                        Ban IP
                      </button>
                    ) : (
                      <button
                        style={{ marginLeft: 8 }}
                        onClick={() => handleUnbanIp(u.ipAddress)}
                      >
                        Unban IP
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          {ipBanStatus && <div style={{ color: "#ffd86b" }}>{ipBanStatus}</div>}
        </div>
      )}
      <input
        placeholder="Search user..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          marginBottom: 16,
          padding: "12px 16px",
          borderRadius: 12,
          border: "2px solid #D4C4A8",
          background: "#F5EFE0",
          color: "#2C2C2C",
          fontSize: "1rem",
          fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
          outline: "none",
          transition: "all 0.3s ease"
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#7B6857";
          e.target.style.boxShadow = "0 0 16px rgba(123, 104, 87, 0.4)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#D4C4A8";
          e.target.style.boxShadow = "none";
        }}
      />
      <ul style={{ 
        maxHeight: 150, 
        overflowY: "auto", 
        marginBottom: 16,
        background: "rgba(245, 239, 224, 0.1)",
        borderRadius: 12,
        padding: 12,
        border: "2px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)"
      }}>
        {filtered.map((u) => (
          <li
            key={u.uid}
            style={{
              cursor: "pointer",
              background: selected?.uid === u.uid ? "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)" : "rgba(245, 239, 224, 0.1)",
              color: selected?.uid === u.uid ? "#F5EFE0" : "#F5EFE0",
              padding: "12px 16px",
              borderRadius: 8,
              marginBottom: 8,
              border: selected?.uid === u.uid ? "2px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
              fontWeight: selected?.uid === u.uid ? 600 : 400,
              boxShadow: selected?.uid === u.uid ? "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)" : "none"
            }}
            onClick={() => {
              setSelected(u);
              setPointsUser(u.displayName || u.email || "");
            }}
            onMouseEnter={(e) => {
              if (selected?.uid !== u.uid) {
                e.target.style.background = "rgba(245, 239, 224, 0.2)";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (selected?.uid !== u.uid) {
                e.target.style.background = "rgba(245, 239, 224, 0.1)";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            {u.displayName || u.email || u.uid} ({u.currency ?? 0} nits)
          </li>
        ))}
      </ul>
      {selected && roles.includes("admin") && (
        <div style={{ 
          marginBottom: 24,
          background: "rgba(245, 239, 224, 0.1)",
          padding: 20,
          borderRadius: 16,
          border: "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)"
        }}>
          <h3 style={{
            color: "#D4C4A8",
            fontSize: "1.3rem",
            fontFamily: '"Cinzel", serif',
            fontWeight: 600,
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            marginBottom: 16
          }}>Currency Management</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{
                width: 100,
                padding: "8px 12px",
                borderRadius: 8,
                border: "2px solid #D4C4A8",
                background: "#F5EFE0",
                color: "#2C2C2C",
                fontSize: "1rem",
                fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
                outline: "none",
                transition: "all 0.3s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#7B6857";
                e.target.style.boxShadow = "0 0 16px rgba(123, 104, 87, 0.4)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D4C4A8";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              onClick={() => handleNitsChange(amount)}
              style={{
                background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 12,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.9rem",
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
              + Nits
            </button>
            <button 
              onClick={() => handleNitsChange(-amount)}
              style={{
                background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 12,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.9rem",
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
              - Nits
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <h4>Suspend / ban controls</h4>
            <label>
              Suspension (hours):
              <input
                type="number"
                min={0}
                value={suspendHours}
                onChange={(e) => setSuspendHours(Number(e.target.value))}
                style={{ width: 50, marginLeft: 4 }}
              />
            </label>
            <label style={{ marginLeft: 8 }}>
              Minutes:
              <input
                type="number"
                min={0}
                max={59}
                value={suspendMinutes}
                onChange={(e) => setSuspendMinutes(Number(e.target.value))}
                style={{ width: 50, marginLeft: 4 }}
              />
            </label>
            <input
              type="text"
              placeholder="Reason for suspension (optional)"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              style={{
                width: "100%",
                margin: "8px 0",
                padding: 4,
                borderRadius: 4,
              }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button 
                onClick={handleSuspendUser}
                style={{
                  background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                  color: "#F5EFE0",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 12,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
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
                Set suspension
              </button>
              <button
                onClick={() => {
                  setSuspendHours(0);
                  setSuspendMinutes(0);
                  setSuspendReason("");
                  handleSuspendUser();
                }}
                style={{
                  background: "linear-gradient(135deg, #D4C4A8 0%, #B8A082 100%)",
                  color: "#2C2C2C",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 12,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
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
                Clear suspension
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                onClick={handleBanUser}
                style={{
                  background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                  color: "#F5EFE0",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 12,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
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
                Ban user
              </button>
              <button
                onClick={handleUnbanUser}
                style={{
                  background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                  color: "#F5EFE0",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 12,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
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
                Unban user
              </button>
            </div>
            {banStatus && <div style={{ color: "#ffd86b" }}>{banStatus}</div>}
            {selected.pausedUntil && selected.pausedUntil > Date.now() && (
              <div style={{ color: "#ffd86b" }}>
                Suspended until:{" "}
                {new Date(selected.pausedUntil).toLocaleString()}
              </div>
            )}
            {typeof selected.suspensionCount === "number" && (
              <div style={{ color: "#ffd86b", marginTop: 4 }}>
                Suspensions: <b>{selected.suspensionCount}</b>
              </div>
            )}
            {selected.banned && (
              <div style={{ color: "#ffd86b" }}>User is banned</div>
            )}
            {selected.bannedIp && (
              <div style={{ color: "#ffd86b" }}>User's IP is banned</div>
            )}
          </div>
        </div>
      )}
      {status && <div style={{ color: "#ff0", marginTop: 8 }}>{status}</div>}

      {/* Points management section */}
      {(roles.includes("admin") || roles.includes("teacher")) && (
        <div style={{ 
          marginTop: 24,
          background: "rgba(245, 239, 224, 0.1)",
          padding: 20,
          borderRadius: 16,
          border: "2px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)"
        }}>
          <h3 style={{
            color: "#D4C4A8",
            fontSize: "1.3rem",
            fontFamily: '"Cinzel", serif',
            fontWeight: 600,
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
            marginBottom: 16
          }}>Add / subtract points</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text"
              placeholder="Brukernavn eller e-post"
              value={pointsUser}
              onChange={(e) => setPointsUser(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "2px solid #D4C4A8",
                background: "#F5EFE0",
                color: "#2C2C2C",
                fontSize: "1rem",
                fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
                outline: "none",
                transition: "all 0.3s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#7B6857";
                e.target.style.boxShadow = "0 0 16px rgba(123, 104, 87, 0.4)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D4C4A8";
                e.target.style.boxShadow = "none";
              }}
            />
            <input
              type="number"
              placeholder="Number of points (+/-)"
              value={pointsAmount}
              onChange={(e) => setPointsAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "2px solid #D4C4A8",
                background: "#F5EFE0",
                color: "#2C2C2C",
                fontSize: "1rem",
                fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
                outline: "none",
                transition: "all 0.3s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#7B6857";
                e.target.style.boxShadow = "0 0 16px rgba(123, 104, 87, 0.4)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#D4C4A8";
                e.target.style.boxShadow = "none";
              }}
            />
            <button 
              onClick={handlePointsUpdate}
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
              Update points
            </button>
            {pointsMessage && (
              <div
                style={{ 
                  color: "#ffd86b", 
                  marginTop: 8,
                  padding: "8px 12px",
                  background: "rgba(255, 216, 107, 0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 216, 107, 0.3)",
                  fontSize: "0.9rem",
                  fontWeight: 500
                }}
              >
                {pointsMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 18+ Forum Access Section */}
      <div style={{ marginTop: 32 }}>
        <AgeVerificationAdmin />
      </div>
    </div>
  );
}
