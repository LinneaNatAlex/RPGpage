import style from "./UserMap.module.css";
import { useState } from "react";
import UserList from "../../Components/UserList/UserList.jsx";
import styles from "../../Components/UserList/UserList.module.css";

// This is the UserMap page where users will be displayed
const UserMap = () => {
  const [userQuery, setUserQuery] = useState("");

  return (
    <div className={style.userMapContainer}>
      <UserList userQuery={userQuery} />
    </div>
  );
};

export default UserMap;
