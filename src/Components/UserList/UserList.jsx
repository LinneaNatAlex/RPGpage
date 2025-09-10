// Imorting the function needed to fetch the users and the logic.
import { Link } from "react-router-dom";
import styles from "./UserList.module.css";
import useUsers from "../../hooks/useUser"; // Importing the custom hook to fetch users
import { auth } from "../../firebaseConfig";

const UserList = ({ userQuery }) => {
  const { users, loading } = useUsers(); //fetching the users from the costum useUsers hook

  // Hent innlogget bruker
  const currentUser = auth.currentUser;
  // Filter users by search query if provided
  const filteredUsers = userQuery
    ? users.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(userQuery.toLowerCase()) ||
          u.race?.toLowerCase().includes(userQuery.toLowerCase()) ||
          u.className?.toLowerCase().includes(userQuery.toLowerCase())
      )
    : users;

  // Calculate total points per race
  const racePoints = {};
  filteredUsers.forEach((u) => {
    if (!u.race) return;
    if (!racePoints[u.race]) racePoints[u.race] = 0;
    racePoints[u.race] += u.points || 0;
  });

  // Sort students by points descending
  const sortedUsers = [...filteredUsers].sort(
    (a, b) => (b.points || 0) - (a.points || 0)
  );
  // Sort races by total points descending
  const sortedRacePoints = Object.entries(racePoints).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className={styles.userListWrapper}>
      <table className={styles.userListContainer}>
        <thead>
          <tr className={styles.tableHeader}>
            <th scope="col">Student/Teacher</th>
            <th scope="col">Race</th>
            <th scope="col">Class</th>
            <th scope="col">Points</th>
            <th scope="col">Profile</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user, idx) => (
            <tr
              key={user.uid}
              style={
                idx === 0 ? { background: "#2e2e4d", fontWeight: "bold" } : {}
              }
            >
              <td>
                {(() => {
                  let nameClass = styles.userName;
                  if (user.roles?.some((r) => r.toLowerCase() === "headmaster"))
                    nameClass += ` ${styles.headmasterName}`;
                  else if (
                    user.roles?.some((r) => r.toLowerCase() === "teacher")
                  )
                    nameClass += ` ${styles.teacherName}`;
                  else if (
                    user.roles?.some((r) => r.toLowerCase() === "shadowpatrol")
                  )
                    nameClass += ` ${styles.shadowPatrolName}`;
                  else if (user.roles?.some((r) => r.toLowerCase() === "admin"))
                    nameClass += ` ${styles.adminName}`;
                  return <span className={nameClass}>{user.displayName}</span>;
                })()}
              </td>
              <td>{user.race}</td>
              <td>{user.class}</td>
              <td
                style={{
                  fontWeight: "bold",
                  color: idx === 0 ? "#ffd700" : "#fff",
                }}
              >
                {user.points || 0}
              </td>
              <td>
                <Link to={`/user/${user.uid}`} className={styles.profileLink}>
                  View Profile
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Race points summary */}
      <div
        style={{
          marginTop: 32,
          background: "#232340",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 4px 24px #0006",
          maxWidth: 400,
          marginLeft: "auto",
          marginRight: "auto",
          textAlign: "center",
        }}
      >
        <h3 style={{ marginBottom: 16, color: "#ffd700", letterSpacing: 1 }}>
          Total points per race
        </h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sortedRacePoints.map(([race, points], i) => (
            <li
              key={race}
              style={{
                marginBottom: 8,
                fontWeight: i === 0 ? "bold" : "normal",
                color: i === 0 ? "#ffd700" : "#fff",
                fontSize: i === 0 ? 20 : 16,
                background: i === 0 ? "#2e2e4d" : "transparent",
                borderRadius: 6,
                padding: i === 0 ? "8px 0" : 0,
              }}
            >
              <b>{race}:</b> {points} points
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
export default UserList;
