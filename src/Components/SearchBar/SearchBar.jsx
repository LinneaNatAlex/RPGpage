// Imports the components and styles
import styles from "./SearchBar.module.css";
import { useState } from "react";

const SearchBar = ({ setUserQuery }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // HANDLE CHANGE is called when the user type in the displayName in the input field
  const handleChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setUserQuery(value);
  };
  // INNPUT FIELD FOR SEARCHBAR
  return (
    <div className={styles.searchBarContainer}>
      <input
        id="search-users"
        name="searchUsers"
        className={styles.searchInput}
        type="text"
        placeholder="Search for users..."
        value={searchQuery}
        onChange={handleChange}
      />
    </div>
  );
};

export default SearchBar;
