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
  collection,
  getDocs,
  writeBatch,
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

  // Force light theme to match the beige page theme
  const isDarkMode = false; // Always use light theme for admin panel

  // Light theme colors to match the beige page design
  const theme = {
    background: "#F5EFE0", // Light beige background
    text: "#2C2C2C", // Dark text for readability
    secondaryText: "#7B6857", // Brown secondary text
    border: "#D4C4A8", // Light brown borders
    accent: "#ffd86b", // Gold accent color
  };

  // Suspension/ban/IP-ban state
  const [suspendHours, setSuspendHours] = useState(0);
  const [suspendMinutes, setSuspendMinutes] = useState(0);
  const [banStatus, setBanStatus] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [ipBanStatus, setIpBanStatus] = useState("");
  const [showBanned, setShowBanned] = useState(false);

  // Detention state
  const [detentionStatus, setDetentionStatus] = useState("");

  const [pointsUser, setPointsUser] = useState("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsMessage, setPointsMessage] = useState("");
  const [unfaintStatus, setUnfaintStatus] = useState("");
  const [chatClearStatus, setChatClearStatus] = useState("");

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
      setStatus("Only admin can change Nits.");
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

  /** Give nits to all users (or subtract). Uses increment so no read needed per user. */
  async function handleNitsChangeAll(delta) {
    if (!roles.includes("admin")) {
      setStatus("Only admin can change Nits.");
      return;
    }
    if (users.length === 0) {
      setStatus("No users to update.");
      return;
    }
    setStatus("Working... (updating all users)");
    let done = 0;
    for (const u of users) {
      const ref = doc(db, "users", u.uid);
      await updateDoc(ref, { currency: increment(delta) });
      done++;
    }
    setStatus(
      `Nits updated for all ${done} users (${
        delta >= 0 ? "+" : ""
      }${delta} each).`
    );
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
      setBanStatus("Only admin can ban users.");
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

  // Detention functions
  async function handleDetentionUser() {
    if (!selected) return;
    if (
      !roles.includes("admin") &&
      !roles.includes("teacher") &&
      !roles.includes("shadowpatrol") &&
      !roles.includes("headmaster")
    ) {
      setDetentionStatus(
        "Only admin, teacher, shadow patrol, or headmaster can assign detention."
      );
      return;
    }
    setDetentionStatus("Working...");
    const ref = doc(db, "users", selected.uid);
    const detentionUntil = Date.now() + 60 * 60 * 1000; // 1 hour from now
    await updateDoc(ref, {
      detentionUntil: detentionUntil,
      detentionReason: "Curfew violation or rule breaking",
    });
    setDetentionStatus(
      `User sent to detention until ${new Date(
        detentionUntil
      ).toLocaleString()}`
    );
  }

  async function handleClearDetention() {
    if (!selected) return;
    if (
      !roles.includes("admin") &&
      !roles.includes("teacher") &&
      !roles.includes("shadowpatrol") &&
      !roles.includes("headmaster")
    ) {
      setDetentionStatus(
        "Only admin, teacher, shadow patrol, or headmaster can clear detention."
      );
      return;
    }
    setDetentionStatus("Working...");
    const ref = doc(db, "users", selected.uid);
    await updateDoc(ref, {
      detentionUntil: null,
      detentionReason: null,
    });
    setDetentionStatus("Detention cleared.");
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

  const handleUnfaintUser = async () => {
    if (!selected) return;
    if (!roles.includes("admin")) {
      setUnfaintStatus("Only admin can unfaint users.");
      return;
    }
    setUnfaintStatus("Working...");
    try {
      const ref = doc(db, "users", selected.uid);
      await updateDoc(ref, {
        health: 100,
        infirmaryEnd: null,
      });
      setUnfaintStatus(
        `${
          selected.displayName || selected.email || selected.uid
        } has been recovered from the infirmary.`
      );
      setTimeout(() => setUnfaintStatus(""), 5000);
    } catch (err) {
      setUnfaintStatus("Error: " + err.message);
    }
  };

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
      setPointsMessage("Error: " + err.message);
    }
  };

  async function clearAllGeneralChatMessages() {
    if (!roles.includes("admin")) {
      setChatClearStatus("Only admin can clear chat.");
      return;
    }
    setChatClearStatus("Clearing…");
    try {
      const messagesRef = collection(db, "messages");
      const BATCH_SIZE = 500;
      let totalDeleted = 0;
      while (true) {
        const snap = await getDocs(messagesRef);
        if (snap.empty) break;
        const batch = writeBatch(db);
        const toDelete = snap.docs.slice(0, BATCH_SIZE);
        toDelete.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        totalDeleted += toDelete.length;
        if (toDelete.length < BATCH_SIZE) break;
      }
      setChatClearStatus(
        totalDeleted > 0
          ? `Done. Deleted ${totalDeleted} message(s) from general chat.`
          : "General chat was already empty."
      );
    } catch (error) {
      setChatClearStatus(`Error: ${error.message}`);
    }
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "2rem auto",
        background: isDarkMode
          ? "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)"
          : "linear-gradient(135deg, #F5EFE0 0%, #E8DDD4 100%)",
        color: theme.text,
        padding: 40,
        borderRadius: 0,
        boxShadow: isDarkMode
          ? "0 12px 48px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)"
          : "0 12px 48px rgba(139, 69, 19, 0.15), 0 4px 16px rgba(139, 69, 19, 0.1)",
        border: `3px solid ${theme.border}`,
        position: "relative",
        overflow: "visible",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(90deg, #D4C4A8 0%, #7B6857 50%, #D4C4A8 100%)",
          borderRadius: 0,
        }}
      />
      <h2
        style={{
          fontFamily: '"Cinzel", serif',
          fontSize: "2.2rem",
          fontWeight: 700,
          letterSpacing: "1.5px",
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        Admin Panel
      </h2>
      {(roles.includes("admin") ||
        roles.includes("teacher") ||
        roles.includes("archivist")) && <ShopProductAdmin />}

      <button
        onClick={() => setShowBanned((v) => !v)}
        style={{
          background: "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)",
          color: "#F5EFE0",
          border: "2px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 0,
          padding: "12px 24px",
          fontWeight: 600,
          fontSize: "1rem",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow:
            "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
          fontFamily: '"Cinzel", serif',
          letterSpacing: "0.5px",
          marginBottom: 20,
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow =
            "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow =
            "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
        }}
      >
        {showBanned ? "Hide banned users/IPs" : "Show banned users/IPs"}
      </button>
      {showBanned && (
        <div
          style={{
            background: "rgba(245, 239, 224, 0.1)",
            padding: 20,
            borderRadius: 0,
            marginBottom: 24,
            border: "2px solid rgba(255, 255, 255, 0.2)",
            boxShadow:
              "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3
            style={{
              color: theme.secondaryText,
              fontSize: "1.3rem",
              fontFamily: '"Cinzel", serif',
              fontWeight: 600,
              textShadow: isDarkMode
                ? "0 1px 2px rgba(0, 0, 0, 0.3)"
                : "0 1px 2px rgba(255, 255, 255, 0.3)",
              marginBottom: 16,
            }}
          >
            Banned users & IPs
          </h3>
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
      <label
        htmlFor="admin-user-search"
        style={{
          display: "block",
          marginBottom: 6,
          color: theme.secondaryText,
          fontWeight: 600,
        }}
      >
        Search user
      </label>
      <input
        id="admin-user-search"
        name="adminUserSearch"
        type="search"
        autoComplete="off"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          marginBottom: 16,
          padding: "12px 16px",
          borderRadius: 0,
          border: `2px solid ${theme.border}`,
          background: theme.background,
          color: theme.text,
          fontSize: "1rem",
          fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
          outline: "none",
          transition: "all 0.3s ease",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = theme.secondaryText;
          e.target.style.boxShadow = `0 0 16px ${
            isDarkMode ? "rgba(123, 104, 87, 0.4)" : "rgba(212, 196, 168, 0.4)"
          }`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = theme.border;
          e.target.style.boxShadow = "none";
        }}
      />
      {/* User count info */}
      <div
        style={{
          marginBottom: "8px",
          fontSize: "14px",
          color: theme.secondaryText,
          fontStyle: "italic",
        }}
      >
        Showing up to {Math.min(filtered.length, 20)} of {filtered.length} users
        {filtered.length > 20 && " (scroll to see more)"}
      </div>

      <ul
        style={{
          maxHeight: "200px", // Space for about 5 items
          overflowY: "auto",
          marginBottom: 16,
          background: theme.background,
          borderRadius: 0,
          padding: 12,
          border: `2px solid ${theme.border}`,
          boxShadow: "0 4px 16px rgba(123, 104, 87, 0.15)",
        }}
      >
        {filtered.slice(0, 20).map(
          (
            u // Show max 20 in DOM but limit visible to ~5 with scroll
          ) => (
            <li
              key={u.uid}
              style={{
                cursor: "pointer",
                background:
                  selected?.uid === u.uid
                    ? isDarkMode
                      ? "linear-gradient(135deg, #7B6857 0%, #8B7A6B 100%)"
                      : "linear-gradient(135deg, #D4C4A8 0%, #C4B49A 100%)"
                    : isDarkMode
                    ? "rgba(245, 239, 224, 0.1)"
                    : "rgba(123, 104, 87, 0.1)",
                color: theme.text,
                padding: "12px 16px",
                borderRadius: 0,
                marginBottom: 8,
                border:
                  selected?.uid === u.uid
                    ? `2px solid ${
                        isDarkMode
                          ? "rgba(255, 255, 255, 0.3)"
                          : "rgba(123, 104, 87, 0.3)"
                      }`
                    : `1px solid ${
                        isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(123, 104, 87, 0.1)"
                      }`,
                transition: "all 0.3s ease",
                fontWeight: selected?.uid === u.uid ? 600 : 400,
                boxShadow:
                  selected?.uid === u.uid
                    ? isDarkMode
                      ? "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)"
                      : "0 4px 16px rgba(123, 104, 87, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.8)"
                    : "none",
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
          )
        )}
        {filtered.length === 0 && (
          <li
            style={{
              color: theme.secondaryText,
              fontStyle: "italic",
              textAlign: "center",
              padding: "20px",
            }}
          >
            No users found matching "{search}"
          </li>
        )}
      </ul>
      {selected && roles.includes("admin") && (
        <div
          style={{
            marginBottom: 24,
            background: "rgba(245, 239, 224, 0.1)",
            padding: 20,
            borderRadius: 0,
            border: "2px solid rgba(255, 255, 255, 0.2)",
            boxShadow:
              "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Unfaint user (Infirmary) – admin kan hente brukere ut av infirmary */}
          <div style={{ marginBottom: 20 }}>
            <h3
              style={{
                color: theme.secondaryText,
                fontSize: "1.15rem",
                fontFamily: '"Cinzel", serif',
                fontWeight: 600,
                textShadow: isDarkMode
                  ? "0 1px 2px rgba(0, 0, 0, 0.3)"
                  : "0 1px 2px rgba(255, 255, 255, 0.3)",
                marginBottom: 10,
              }}
            >
              Unfaint user (Infirmary)
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: theme.text,
                opacity: 0.9,
                marginBottom: 10,
              }}
            >
              Velg bruker over og klikk for å hente dem ut av infirmary (health
              100, ingen ventetid).
            </p>
            <button
              onClick={handleUnfaintUser}
              style={{
                background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 0,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
              }}
            >
              Unfaint selected user
            </button>
            {unfaintStatus && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  background: "rgba(33, 150, 243, 0.15)",
                  borderRadius: 0,
                  border: "1px solid rgba(33, 150, 243, 0.3)",
                  fontSize: "0.9rem",
                  color: theme.text,
                }}
              >
                {unfaintStatus}
              </div>
            )}
          </div>

          <h3
            style={{
              color: theme.secondaryText,
              fontSize: "1.3rem",
              fontFamily: '"Cinzel", serif',
              fontWeight: 600,
              textShadow: isDarkMode
                ? "0 1px 2px rgba(0, 0, 0, 0.3)"
                : "0 1px 2px rgba(255, 255, 255, 0.3)",
              marginBottom: 16,
            }}
          >
            Currency Management
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <label
              htmlFor="admin-nits-amount"
              style={{ fontWeight: 600, color: theme.text }}
            >
              Amount:
            </label>
            <input
              id="admin-nits-amount"
              name="nitsAmount"
              type="number"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{
                width: 100,
                padding: "8px 12px",
                borderRadius: 0,
                border: `2px solid ${theme.border}`,
                background: theme.background,
                color: theme.text,
                fontSize: "1rem",
                fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
                outline: "none",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.secondaryText;
                e.target.style.boxShadow = `0 0 16px ${
                  isDarkMode
                    ? "rgba(123, 104, 87, 0.4)"
                    : "rgba(212, 196, 168, 0.4)"
                }`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.border;
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              onClick={() => handleNitsChange(amount)}
              style={{
                background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 0,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
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
                borderRadius: 0,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
              }}
            >
              - Nits
            </button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: theme.secondaryText,
                fontSize: "0.9rem",
                marginRight: 4,
              }}
            >
              Give to all users ({users.length}):
            </span>
            <button
              onClick={() => handleNitsChangeAll(amount)}
              style={{
                background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 0,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
              }}
            >
              + Nits to all
            </button>
            <button
              onClick={() => handleNitsChangeAll(-amount)}
              style={{
                background: "linear-gradient(135deg, #ff9800 0%, #e65100 100%)",
                color: "#F5EFE0",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 0,
                padding: "8px 16px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
              }}
            >
              - Nits to all
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <h4>Suspend / ban controls</h4>
            <label htmlFor="admin-suspend-hours">
              Suspension (hours):
              <input
                id="admin-suspend-hours"
                name="suspendHours"
                type="number"
                autoComplete="off"
                min={0}
                value={suspendHours}
                onChange={(e) => setSuspendHours(Number(e.target.value))}
                style={{ width: 50, marginLeft: 4 }}
              />
            </label>
            <label htmlFor="admin-suspend-minutes" style={{ marginLeft: 8 }}>
              Minutes:
              <input
                id="admin-suspend-minutes"
                name="suspendMinutes"
                type="number"
                autoComplete="off"
                min={0}
                max={59}
                value={suspendMinutes}
                onChange={(e) => setSuspendMinutes(Number(e.target.value))}
                style={{ width: 50, marginLeft: 4 }}
              />
            </label>
            <label
              htmlFor="admin-suspend-reason"
              style={{ display: "block", marginTop: 8 }}
            >
              Reason (optional):
            </label>
            <input
              id="admin-suspend-reason"
              name="suspendReason"
              type="text"
              autoComplete="off"
              placeholder="Reason for suspension (optional)"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              style={{
                width: "100%",
                margin: "8px 0",
                padding: 4,
                borderRadius: 0,
              }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                onClick={handleSuspendUser}
                style={{
                  background:
                    "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                  color: "#F5EFE0",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 0,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  fontFamily: '"Cinzel", serif',
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
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
                  background:
                    "linear-gradient(135deg, #D4C4A8 0%, #B8A082 100%)",
                  color: "#2C2C2C",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 0,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  fontFamily: '"Cinzel", serif',
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
                }}
              >
                Clear suspension
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                onClick={handleBanUser}
                style={{
                  background:
                    "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                  color: "#F5EFE0",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 0,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  fontFamily: '"Cinzel", serif',
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
                }}
              >
                Ban user
              </button>
              <button
                onClick={handleUnbanUser}
                style={{
                  background:
                    "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                  color: "#F5EFE0",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 0,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow:
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  fontFamily: '"Cinzel", serif',
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
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

            {/* Detention Controls */}
            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <h4>Detention Controls</h4>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  onClick={handleDetentionUser}
                  style={{
                    background:
                      "linear-gradient(135deg, #ff5722 0%, #d84315 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 0,
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                    fontFamily: '"Cinzel", serif',
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
                  }}
                >
                  Send to Detention
                </button>
                <button
                  onClick={handleClearDetention}
                  style={{
                    background:
                      "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                    color: "#F5EFE0",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 0,
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow:
                      "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                    fontFamily: '"Cinzel", serif',
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
                  }}
                >
                  Clear Detention
                </button>
              </div>
              {detentionStatus && (
                <div style={{ color: "#ffd86b", marginTop: 8 }}>
                  {detentionStatus}
                </div>
              )}
              {selected.detentionUntil &&
                selected.detentionUntil > Date.now() && (
                  <div style={{ color: "#ffd86b", marginTop: 8 }}>
                    In detention until:{" "}
                    {new Date(selected.detentionUntil).toLocaleString()}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
      {status && <div style={{ color: "#ff0", marginTop: 8 }}>{status}</div>}

      {/* Points management section */}
      {(roles.includes("admin") ||
        roles.includes("teacher") ||
        roles.includes("archivist")) && (
        <div
          style={{
            marginTop: 24,
            background: "rgba(245, 239, 224, 0.1)",
            padding: 20,
            borderRadius: 0,
            border: "2px solid rgba(255, 255, 255, 0.2)",
            boxShadow:
              "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3
            style={{
              color: "#D4C4A8",
              fontSize: "1.3rem",
              fontFamily: '"Cinzel", serif',
              fontWeight: 600,
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              marginBottom: 16,
            }}
          >
            Add / subtract points
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label
              htmlFor="admin-points-username"
              style={{ fontWeight: 600, color: "#D4C4A8" }}
            >
              Username or email
            </label>
            <input
              id="admin-points-username"
              name="pointsUser"
              type="text"
              autoComplete="username"
              placeholder="Username or email"
              value={pointsUser}
              onChange={(e) => setPointsUser(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 0,
                border: "2px solid #D4C4A8",
                background: "#F5EFE0",
                color: "#2C2C2C",
                fontSize: "1rem",
                fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
                outline: "none",
                transition: "all 0.3s ease",
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
            <label
              htmlFor="admin-points-amount"
              style={{ fontWeight: 600, color: "#D4C4A8" }}
            >
              Number of points (+/-)
            </label>
            <input
              id="admin-points-amount"
              name="pointsAmount"
              type="number"
              autoComplete="off"
              placeholder="Number of points (+/-)"
              value={pointsAmount}
              onChange={(e) => setPointsAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 0,
                border: "2px solid #D4C4A8",
                background: "#F5EFE0",
                color: "#2C2C2C",
                fontSize: "1rem",
                fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
                outline: "none",
                transition: "all 0.3s ease",
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
                borderRadius: 0,
                padding: "12px 24px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                fontFamily: '"Cinzel", serif',
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)";
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
                  borderRadius: 0,
                  border: "1px solid rgba(255, 216, 107, 0.3)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                {pointsMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* General chat – clear all messages (admin only) */}
      {roles.includes("admin") && (
        <div
          style={{
            marginTop: 32,
            padding: 20,
            background: "rgba(245, 239, 224, 0.1)",
            borderRadius: 0,
            border: `2px solid ${theme.border}`,
          }}
        >
          <h3
            style={{
              color: theme.secondaryText,
              fontSize: "1.2rem",
              fontFamily: '"Cinzel", serif',
              marginBottom: 12,
            }}
          >
            General chat
          </h3>
          <p style={{ marginBottom: 12, color: theme.secondaryText, fontSize: "0.95rem" }}>
            Remove all messages from the general (main) chat in Firestore. This cannot be undone.
          </p>
          <button
            type="button"
            onClick={clearAllGeneralChatMessages}
            style={{
              padding: "10px 20px",
              background: "#c62828",
              color: "#fff",
              border: "none",
              borderRadius: 0,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear all chat messages
          </button>
          {chatClearStatus && (
            <div style={{ marginTop: 12, fontSize: "0.9rem", color: theme.secondaryText }}>
              {chatClearStatus}
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
