import style from "./OnlineUsers.module.css";
import useOnlineUsers from "../../hooks/useOnlineUsers";
import React, { useContext } from "react";

const OnlineUsers = () => {
  const users = useOnlineUsers();

  if (!users.length) return null;
  // this is where users 'online' are displayed

  return (
    <div className={style.onlineUsersContainer}>
      <h2>Is online Witch/Wizard</h2>
      <ul className={style.onlineUsersList}>
        {users.map((user) => (
          <li key={user.id} className={style.onlineUserItem}>
            <img
              src={user.profileImageUrl || "/icons/avatar.svg"}
              alt="User Avatar"
              className={style.userAvatar}
            />
            {user.displayName}
          </li>
        ))}
      </ul>
    </div>
  );
};
export default OnlineUsers;
