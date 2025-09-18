import style from "./OnlineUsers.module.css";
import useOnlineUsers from "../../hooks/useOnlineUsers";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import GearIcon from "../Icons/Gear.svg";

const OnlineUsers = () => {
  const users = useOnlineUsers();
  const { user } = useAuth();
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [timeoutMinutes, setTimeoutMinutes] = useState(10);
  const [suspendReason, setSuspendReason] = useState("");
  const intervalRef = useRef();

  // Robust online-status: Oppdater lastActive hvert 20. sekund
  useEffect(() => {
    if (!user || !user.uid) return;
    let isOnline = true;
    const setActive = async () => {
      try {
        await updateDoc(doc(db, "users", user.uid), { lastActive: Date.now() });
      } catch {}
    };
    setActive();
    intervalRef.current = setInterval(setActive, 20000);
    // Sett lastActive én siste gang ved tab close
    const handleUnload = () => setActive();
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [user]);

  // Sjekk om innlogget bruker har admin eller teacher rolle
  const isPrivileged = user?.roles?.some((r) =>
    ["admin", "teacher"].includes(r.toLowerCase())
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
          if (u.roles?.some((r) => r.toLowerCase() === "headmaster")) {
            roleClass += ` ${style.headmasterAvatar}`;
            nameClass += ` ${style.headmasterName}`;
          } else if (u.roles?.some((r) => r.toLowerCase() === "teacher")) {
            roleClass += ` ${style.teacherAvatar}`;
            nameClass += ` ${style.teacherName}`;
          } else if (u.roles?.some((r) => r.toLowerCase() === "shadowpatrol")) {
            roleClass += ` ${style.shadowPatrolAvatar}`;
            nameClass += ` ${style.shadowPatrolName}`;
          } else if (u.roles?.some((r) => r.toLowerCase() === "admin")) {
            roleClass += ` ${style.adminAvatar}`;
            nameClass += ` ${style.adminName}`;
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
              <img
                src={u.profileImageUrl || "/icons/avatar.svg"}
                alt="User Avatar"
                className={roleClass}
                style={{
                  boxShadow: inLove ? "0 0 12px 2px #ffb6e6" : undefined,
                  border: isNewUser ? "2px solid #4da3ff" : undefined,
                }}
              />
              <span className={nameClass}>
                {u.displayName}
                {inDarkMode && (
                  <span
                    style={{
                      background: "#1a1a1a",
                      color: "#e0e0e0",
                      borderRadius: 6,
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
                      borderRadius: 6,
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
                  title="Set timeout"
                  onClick={() => handleTimeoutClick(u)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginLeft: 8,
                  }}
                >
                  <img
                    src={GearIcon}
                    alt="Set timeout"
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default OnlineUsers;
