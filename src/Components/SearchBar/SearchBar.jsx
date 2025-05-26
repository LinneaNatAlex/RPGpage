import Button from "../Button/Button";
import styles from "./SearchBar.module.css";
import { useState } from "react";

const SearchBar = ({ setUserQuery }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // const searchDatabase = async (search) => {
  //   try {
  //     const data = await searchUserTerm();
  //     const filteredUsers = data.filter((user) => {
  //       return user.displayName?.toLowerCase().includes(search.toLowerCase());
  //     });
  //     setSearchUserTerm(filteredUsers);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setUserQuery(value);
  };

  // const handleSearch = (e) => {
  //   e.preventDefault();
  //   searchDatabase(searchQuery);
  // };

  const handleReset = async () => {
    setSearchQuery("");
    setUserQuery("");
  };

  return (
    <div className={styles.searchBarContainer}>
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search for users..."
        value={searchQuery}
        onChange={handleChange}
      />
      <div className={styles.searchButtonContainer}>
        {searchQuery && (
          <>
            <Button
              className={styles.searchButton}
              onClick={handleReset}
              buttonType="search"
              label="Search"
            ></Button>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
