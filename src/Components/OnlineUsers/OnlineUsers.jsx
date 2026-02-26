import style from "./OnlineUsers.module.css";
import useOnlineUsers from "../../hooks/useOnlineUsers";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/authContext";
import useUserData from "../../hooks/useUserData";
import { db } from "../../firebaseConfig";
import { doc, updateDoc, getDoc, deleteField } from "firebase/firestore";
import { Link } from "react-router-dom";
import GearIcon from "../Icons/Gear.svg";

/** Vis kun fornavn og etternavn: første og siste ord av displayName */
function getFirstAndLastName(displayName) {
  if (!displayName || typeof displayName !== "string") return displayName || "";
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return displayName.trim();
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

const OnlineUsers = () => {
  const users = useOnlineUsers();
  const { user } = useAuth();
  const { userData } = useUserData();
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [timeoutMinutes, setTimeoutMinutes] = useState(10);
  const [suspendReason, setSuspendReason] = useState("");
  const [detentionStatus, setDetentionStatus] = useState("");
  const intervalRef = useRef();

  // Optimized online-status: Oppdater lastActive hvert 2. minutt (redusert fra 20 sek)
  useEffect(() => {
    if (!user || !user.uid) return;
    let isOnline = true;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 2 * 60 * 1000; // 2 minutter
    
    const setActive = async () => {
      const now = Date.now();
      // Only update if enough time has passed
      if (now - lastUpdate >= UPDATE_INTERVAL) {
        try {
          await updateDoc(doc(db, "users", user.uid), { lastActive: now });
          lastUpdate = now;
        } catch {}
      }
    };
    setActive();
    intervalRef.current = setInterval(setActive, 30000); // Check every 30 seconds
    // Sett lastActive én siste gang ved tab close
    const handleUnload = () => setActive();
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [user]);

  // Bruk roller fra userData (Firestore) så professor/admin alltid ser merkene (tannhjul m.m.)
  const roles = userData?.roles || user?.roles || [];
  const isPrivileged = roles.some((r) =>
    ["admin", "professor", "teacher", "shadowpatrol", "headmaster", "archivist"].includes((r || "").toLowerCase())
  );
  const canAssignDetention = roles.some((r) =>
    ["admin", "professor", "teacher", "shadowpatrol", "headmaster"].includes((r || "").toLowerCase())
  );

  const handleTimeoutClick = (targetUser) => {
    setSelectedUser(targetUser);
    setShowTimeoutModal(true);
    setTimeoutMinutes(10);
  };

  const handleTimeoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    const until = Date.now() + timeoutMinutes * 60 * 1000;
    // Get current suspension count
    const ref = doc(db, "users", selectedUser.id);
    let suspCount = 0;
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        suspCount = snap.data().suspensionCount || 0;
      }
    } catch {}
    await updateDoc(ref, {
      pausedUntil: until,
      suspendReason: suspendReason || null,
      suspensionCount: suspCount + 1,
    });
    setShowTimeoutModal(false);
    setSelectedUser(null);
    setSuspendReason("");
  };

  // Detention functions (only admin, professor, shadow patrol, headmaster)
  const handleDetentionUser = async () => {
    if (!selectedUser) return;
    if (!canAssignDetention) {
      setDetentionStatus("Only admin, professor, Shadow Patrol, or Headmaster can assign detention.");
      return;
    }
    setDetentionStatus("Working...");
    try {
      const userRef = doc(db, "users", selectedUser.id || selectedUser.uid);
      const detentionUntil = Date.now() + (60 * 60 * 1000); // 1 hour from now
      await updateDoc(userRef, {
        detentionUntil: detentionUntil,
        detentionReason: "Curfew violation or rule breaking"
      });
      setDetentionStatus(`User sent to detention until ${new Date(detentionUntil).toLocaleString()}`);
      setTimeout(() => {
        setShowTimeoutModal(false);
        setSelectedUser(null);
        setDetentionStatus("");
      }, 2000);
    } catch (err) {
      console.error("Detention assign error:", err);
      setDetentionStatus(err?.message || "Failed to assign detention. Check console.");
    }
  };

  const handleClearDetention = async () => {
    if (!selectedUser) return;
    if (!canAssignDetention) {
      setDetentionStatus("Only admin, professor, Shadow Patrol, or Headmaster can clear detention.");
      return;
    }
    setDetentionStatus("Working...");
    try {
      const userRef = doc(db, "users", selectedUser.id || selectedUser.uid);
      await updateDoc(userRef, {
        detentionUntil: deleteField(),
        detentionReason: deleteField()
      });
      setDetentionStatus("Detention cleared.");
      setTimeout(() => {
        setShowTimeoutModal(false);
        setSelectedUser(null);
        setDetentionStatus("");
      }, 2000);
    } catch (err) {
      console.error("Clear detention error:", err);
      setDetentionStatus(err?.message || "Failed to clear detention. Check console.");
    }
  };

  if (!users.length) return null;
  // this is where users 'online' are displayed

  // Vis kun brukere som har vært aktive siste 2 minutter
  const now = Date.now();
  const filteredUsers = users.filter(
    (u) => u.lastActive && now - u.lastActive < 10 * 60 * 1000
  );

  return (
    <div className={style.onlineUsersContainer}>
      <h2>Online</h2>
      <ul className={style.onlineUsersList}>
        {filteredUsers.map((u) => {
          let roleClass = style.userAvatar;
          let nameClass = style.userName;
          let dataRole = null;
          if (u.roles?.some((r) => r.toLowerCase() === "headmaster")) {
            roleClass += ` ${style.headmasterAvatar}`;
            nameClass += ` ${style.headmasterName}`;
            dataRole = "headmaster";
          } else if (u.roles?.some((r) => (r || "").toLowerCase() === "professor" || (r || "").toLowerCase() === "teacher")) {
            roleClass += ` ${style.professorAvatar}`;
            nameClass += ` ${style.professorName}`;
            dataRole = "professor";
          } else if (u.roles?.some((r) => r.toLowerCase() === "shadowpatrol")) {
            roleClass += ` ${style.shadowPatrolAvatar}`;
            nameClass += ` ${style.shadowPatrolName}`;
            dataRole = "shadowpatrol";
          } else if (u.roles?.some((r) => r.toLowerCase() === "admin")) {
            roleClass += ` ${style.adminAvatar}`;
            nameClass += ` ${style.adminName}`;
            dataRole = "admin";
          } else if (u.roles?.some((r) => r.toLowerCase() === "archivist")) {
            roleClass += ` ${style.archivistAvatar}`;
            nameClass += ` ${style.archivistName}`;
            dataRole = "archivist";
          }
          // Love Potion effect: pink glow and text if inLoveUntil in future
          const inLove = u.inLoveUntil && u.inLoveUntil > Date.now();
          // Dark Mode Potion effect: show /Dark indicator
          const inDarkMode = u.darkModeUntil && u.darkModeUntil > Date.now();
          // Ny bruker: opprettet siste 24 timer
          const isNewUser =
            u.createdAt &&
            (Date.now() - u.createdAt.toMillis
              ? u.createdAt.toMillis()
              : u.createdAt) <
              24 * 60 * 60 * 1000;
          return (
            <li key={u.id} className={style.onlineUserItem}>
              <Link
                to={`/user/${u.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                  color: "inherit",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <img
                  key={`avatar-${u.id}`}
                  src={u.profileImageUrl || "/icons/avatar.svg"}
                  alt={`${u.displayName || "User"} avatar`}
                  className={roleClass}
                  style={{
                    boxShadow: inLove ? "0 0 12px 2px #ffb6e6" : undefined,
                    border: isNewUser ? "2px solid #4da3ff" : undefined,
                  }}
                />
                <span className={nameClass} data-role={dataRole}>
                  {getFirstAndLastName(u.displayName)}
                  {inDarkMode && (
                    <span
                      style={{
                        background: "#1a1a1a",
                        color: "#e0e0e0",
                        borderRadius: 0,
                        fontSize: "0.8em",
                        fontWeight: 700,
                        marginLeft: 6,
                        padding: "2px 7px",
                        boxShadow: "0 0 8px #444",
                        verticalAlign: "middle",
                        border: "1px solid #444",
                      }}
                    >
                      /Dark
                    </span>
                  )}
                  {isNewUser && (
                    <span
                      style={{
                        background: "#4da3ff",
                        color: "#fff",
                        borderRadius: 0,
                        fontSize: "0.8em",
                        fontWeight: 700,
                        marginLeft: 6,
                        padding: "2px 7px",
                        boxShadow: "0 0 8px #4da3ff",
                        verticalAlign: "middle",
                      }}
                    >
                      NY!
                    </span>
                  )}
                </span>
              </Link>
              {inLove && u.inLoveWith && (
                <span
                  style={{
                    marginLeft: 8,
                    color: inDarkMode ? "#ff69b4" : "#ff69b4",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textShadow: inDarkMode ? "0 0 8px #ff69b4" : "0 1px 2px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  In love with {u.inLoveWith}
                </span>
              )}
              {isPrivileged && u.id !== user?.uid && (
                <button
                  className={style.gearButton}
                  title="Admin controls (timeout/detention)"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTimeoutClick(u);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginLeft: 8,
                  }}
                >
                  <img
                    src={GearIcon}
                    alt="Admin controls"
                    style={{ width: 20, height: 20 }}
                  />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {showTimeoutModal && (
        <div className={style.timeoutModalOverlay}>
          <div className={style.timeoutModal}>
            <h3>Set timeout for {selectedUser?.displayName}</h3>
            <form onSubmit={handleTimeoutSubmit}>
              <label>
                Minutes:
                <input
                  id="timeout-minutes"
                  name="timeoutMinutes"
                  type="number"
                  min={1}
                  max={1440}
                  value={timeoutMinutes}
                  onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                  style={{ marginLeft: 8, width: 60 }}
                  required
                />
              </label>
              <label style={{ display: "block", marginTop: 12 }}>
                Reason (optional):
                <input
                  id="suspend-reason"
                  name="suspendReason"
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  style={{ marginLeft: 8, width: 180 }}
                  placeholder="Reason for suspension"
                />
              </label>
              <div style={{ marginTop: 16 }}>
                <button type="submit" className={style.timeoutBtn}>
                  Suspend
                </button>
                <button
                  type="button"
                  className={style.timeoutBtn}
                  onClick={() => setShowTimeoutModal(false)}
                  style={{ marginLeft: 8 }}
                >
                  Cancel
                </button>
              </div>
              
              {/* Detention Controls - only for admin, professor, shadow patrol, headmaster (not archivist) */}
              {canAssignDetention && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                <h4 style={{ color: "#ff6b6b", marginBottom: 12 }}>Detention Controls</h4>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button 
                    type="button"
                    onClick={handleDetentionUser}
                    style={{
                      background: "linear-gradient(135deg, #ff5722 0%, #d84315 100%)",
                      color: "#F5EFE0",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: 0,
                      padding: "8px 12px",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                  >
                    Send to Detention
                  </button>
                  <button
                    type="button"
                    onClick={handleClearDetention}
                    style={{
                      background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                      color: "#F5EFE0",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: 0,
                      padding: "8px 12px",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                  >
                    Clear Detention
                  </button>
                </div>
                {detentionStatus && (
                  <div style={{ 
                    color: "#ffd86b", 
                    marginTop: 8, 
                    fontSize: "0.9rem",
                    textAlign: "center"
                  }}>
                    {detentionStatus}
                  </div>
                )}
                {selectedUser?.detentionUntil && selectedUser.detentionUntil > Date.now() && (
                  <div style={{ 
                    color: "#ff6b6b", 
                    marginTop: 8, 
                    fontSize: "0.9rem",
                    textAlign: "center"
                  }}>
                    Currently in detention until: {new Date(selectedUser.detentionUntil).toLocaleString()}
                  </div>
                )}
              </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default OnlineUsers;
