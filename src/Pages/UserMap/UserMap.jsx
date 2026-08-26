import style from "./UserMap.module.css";
import { useState } from "react";
import UserList from "../../Components/UserList/UserList.jsx";
import SearchBar from "../../Components/SearchBar/SearchBar.jsx";

const UserMap = () => {
  const [userQuery, setUserQuery] = useState("");

  return (
    <section className={style.mapPage}>
      <header className={style.mapHeader}>
        <div>
          <h1 className={style.mapTitle}>Student Map</h1>
          <p className={style.mapIntro}>
            Find students, check race standings, and open a profile.
          </p>
        </div>
        <div className={style.userSearchBar}>
          <SearchBar setUserQuery={setUserQuery} userQuery={userQuery} />
        </div>
      </header>
      <div className={style.userMapContainer}>
        <UserList userQuery={userQuery} />
      </div>
    </section>
  );
};

export default UserMap;
