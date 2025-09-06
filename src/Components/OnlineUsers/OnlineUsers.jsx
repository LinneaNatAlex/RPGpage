import style from "./OnlineUsers.module.css";
import useOnlineUsers from "../../hooks/useOnlineUsers";
import React, { useState } from "react";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import GearIcon from "../Icons/Gear.svg";

const OnlineUsers = () => {
  const users = useOnlineUsers();
  const { user } = useAuth();
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [timeoutMinutes, setTimeoutMinutes] = useState(10);

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
    await updateDoc(doc(db, "users", selectedUser.id), {
      timeoutUntil: until,
      timeoutSetBy: user.displayName || user.email,
      timeoutSetAt: serverTimestamp(),
    });
    setShowTimeoutModal(false);
    setSelectedUser(null);
  };

  if (!users.length) return null;
  // this is where users 'online' are displayed

  return (
    <div className={style.onlineUsersContainer}>
      <h2>Online</h2>
      <ul className={style.onlineUsersList}>
        {users.map((u) => {
          let roleClass = style.userAvatar;
          if (u.roles?.some((r) => r.toLowerCase() === "headmaster"))
            roleClass += ` ${style.headmasterAvatar}`;
          else if (u.roles?.some((r) => r.toLowerCase() === "teacher"))
            roleClass += ` ${style.teacherAvatar}`;
          else if (u.roles?.some((r) => r.toLowerCase() === "shadowpatrol"))
            roleClass += ` ${style.shadowPatrolAvatar}`;
          else if (u.roles?.some((r) => r.toLowerCase() === "admin"))
            roleClass += ` ${style.adminAvatar}`;
          return (
            <li key={u.id} className={style.onlineUserItem}>
              <img
                src={u.profileImageUrl || "/icons/avatar.svg"}
                alt="User Avatar"
                className={roleClass}
              />
              {u.displayName}
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
              <div style={{ marginTop: 16 }}>
                <button type="submit" className={style.timeoutBtn}>
                  Set timeout
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
