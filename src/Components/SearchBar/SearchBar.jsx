import Button from "../Button/Button";
import styles from "./SearchBar.module.css";
import { useState } from "react";
import { getUserTerms } from "../../firebaseConfig";

const SearchBar = ({ searchUserTerm, setSearchUserTerm }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const searchDatabase = async (search) => {
    try {
      const data = await searchUserTerm();
      const filteredUsers = data.filter((user) => {
        return user.displayName?.toLowerCase().includes(search.toLowerCase());
      });
      setSearchUserTerm(filteredUsers);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSearching(value.length > 0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchDatabase(searchQuery);
    setSearching(true);
  };

  const handleReset = async () => {
    setSearching(false);
    setSearchQuery("");
    try {
      const data = await getUserTerms();
      setSearchUserTerm(data);
    } catch (error) {
      console.log(error);
    }
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
        <Button
          className={styles.searchButton}
          onClick={handleSearch}
          disabled={!searching}
          buttonType="search"
          label="Search"
        ></Button>

        {searching && (
          <Button
            className={styles.resetButton}
            onClick={handleReset}
            label="Reset Search"
            buttonType="reset"
          >
            x
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
