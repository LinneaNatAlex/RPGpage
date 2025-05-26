import { getUserTerms } from "../../firebaseConfig";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./UserList.module.css";

const UserList = ({ userQuery }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getUserTerms();
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (error) {
        console.error("Faild to fetch witch or wizard users:", error.message);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (userQuery) {
      const filtered = users.filter((user) =>
        user.displayName?.toLowerCase().includes(userQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [userQuery, users]);

  return (
    <div className={styles.userListWrapper}>
      <table className={styles.userListContainer}>
        <thead>
          <tr className={styles.tableHeader}>
            <th scope="col">Witch/Wizard</th>
            <th scope="col">House</th>
            <th scope="col">Class</th>
            <th scope="col">Profile</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.uid}>
              <td>{user.displayName}</td>
              <td>{user.house}</td>
              <td>{user.class}</td>
              <td>
                <Link to={`/user/${user.uid}`} className={styles.profileLink}>
                  View Profile
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default UserList;
