// Imorting the function needed to fetch the users and the logic.
import { Link } from "react-router-dom";
import styles from "./UserList.module.css";
import useUsers from "../../hooks/useUser"; // Importing the custom hook to fetch users

const UserList = ({ userQuery }) => {
  const { users, loading } = useUsers(); //fetching the users from the costum useUsers hook

  const filteredUsers = userQuery
    ? users.filter((user) =>
        user.displayName
          ?.toLowerCase()
          .trim()
          .startsWith(userQuery.toLowerCase().trim())
      )
    : users;

  if (loading) return <p>Loading users </p>; // displays a message loding if the users are still loading

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
          {filteredUsers.map(
            (
              user // Mapping the users to display them in tbody
            ) => (
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
            )
          )}
        </tbody>
      </table>
    </div>
  );
};
export default UserList;
