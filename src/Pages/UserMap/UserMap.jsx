import style from "./UserMap.module.css";
import { useState } from "react";
import UserList from "../../Components/UserList/UserList.jsx";
import SearchBar from "../../Components/SearchBar/SearchBar.jsx";

// This is the UserMap page where users will be displayed
const UserMap = () => {
  const [userQuery, setUserQuery] = useState("");

  return (
    <>
      {/* SearchBar that connect to the user list */}
      <div className={style.userSearchBar}>
        <SearchBar setUserQuery={setUserQuery} userQuery={userQuery} />
      </div>
      {/* Userlist that displays either full list or filter list */}
      <div className={style.userMapContainer}>
        <UserList userQuery={userQuery} />
      </div>
    </>
  );
};

export default UserMap;
