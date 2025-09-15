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
      {(roles.includes("admin") || roles.includes("teacher")) && <ShopProductAdmin />}
      <button
        onClick={() => setShowBanned((v) => !v)}
        style={{ marginBottom: 8 }}
      >
        {showBanned ? "Hide banned users/IPs" : "Show banned users/IPs"}
      </button>
      {showBanned && (
        <div
          style={{
            background: "#181820",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <h3>Banned users & IPs</h3>
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
            <button style={{ marginLeft: 8 }} onClick={handleSuspendUser}>
              Set suspension
            </button>
            <button
              style={{ marginLeft: 8 }}
              onClick={() => {
                setSuspendHours(0);
                setSuspendMinutes(0);
                setSuspendReason("");
                handleSuspendUser();
              }}
            >
              Clear suspension
            </button>
            <br />
            <button
              style={{ marginTop: 8, background: "#e53935", color: "#fff" }}
              onClick={handleBanUser}
            >
              Ban user
            </button>
            <button
              style={{ marginLeft: 8, background: "#4caf50", color: "#fff" }}
              onClick={handleUnbanUser}
            >
              Unban user
            </button>
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

      {/* 18+ Forum Access Section */}
      <div style={{ marginTop: 32 }}>
        <AgeVerificationAdmin />
      </div>
    </div>
  );
}
