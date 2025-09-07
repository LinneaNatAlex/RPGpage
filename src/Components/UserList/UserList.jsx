// Imorting the function needed to fetch the users and the logic.
import { Link } from "react-router-dom";
import styles from "./UserList.module.css";
import useUsers from "../../hooks/useUser"; // Importing the custom hook to fetch users
import { auth } from "../../firebaseConfig";

const UserList = ({ userQuery }) => {
  const { users, loading } = useUsers(); //fetching the users from the costum useUsers hook

  // Hent innlogget bruker
  const currentUser = auth.currentUser;
  // Filtrer ut innlogget bruker
  const usersWithoutSelf = currentUser
    ? users.filter((user) => user.uid !== currentUser.uid)
    : users;

  // FILTERING users based on the userQuery!
  const filteredUsers = userQuery
    ? usersWithoutSelf.filter((user) =>
        user.displayName
          ?.toLowerCase()
          .trim()
          .startsWith(userQuery.toLowerCase().trim())
      )
    : usersWithoutSelf;

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
                <td>
                  {(() => {
                    let nameClass = styles.userName;
                    if (
                      user.roles?.some((r) => r.toLowerCase() === "headmaster")
                    )
                      nameClass += ` ${styles.headmasterName}`;
                    else if (
                      user.roles?.some((r) => r.toLowerCase() === "teacher")
                    )
                      nameClass += ` ${styles.teacherName}`;
                    else if (
                      user.roles?.some(
                        (r) => r.toLowerCase() === "shadowpatrol"
                      )
                    )
                      nameClass += ` ${styles.shadowPatrolName}`;
                    else if (
                      user.roles?.some((r) => r.toLowerCase() === "admin")
                    )
                      nameClass += ` ${styles.adminName}`;
                    return (
                      <span className={nameClass}>{user.displayName}</span>
                    );
                  })()}
                </td>
                <td>{user.house}</td>
                <td>{user.class}</td>
                {/* When clicking on the View Profile Link the user get send to the route that contains the specific /user/uid */}
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
