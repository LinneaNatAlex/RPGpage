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
                idx === 0 ? { background: "rgba(245, 239, 224, 0.2)", fontWeight: "bold" } : {}
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
              <td>
                {user.race &&
                ["Witch", "witch", "witches", "Witches"].includes(user.race)
                  ? "Wizard"
                  : user.race}
              </td>
              <td>{user.class}</td>
              <td
                style={{
                  fontWeight: "bold",
                  color: idx === 0 ? "#2C2C2C" : "#2C2C2C",
                  fontSize: "1.1rem",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
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
          background: "linear-gradient(135deg, #5D4E37 0%, #6B5B47 100%)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05)",
          border: "2px solid #7B6857",
          maxWidth: 500,
          marginLeft: "auto",
          marginRight: "auto",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #D4C4A8 0%, #F5EFE0 50%, #D4C4A8 100%)",
          }}
        />
        <h3 style={{ 
          marginBottom: 20, 
          color: "#F5EFE0", 
          letterSpacing: 1.5,
          fontFamily: '"Cinzel", serif',
          fontSize: "1.8rem",
          fontWeight: 700,
          textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
        }}>
          Total points per race
        </h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sortedRacePoints.map(([race, points], i) => {
            const displayRace = [
              "Witch",
              "witch",
              "witches",
              "Witches",
            ].includes(race)
              ? "Wizard"
              : race;
            return (
              <li
                key={race}
                style={{
                  marginBottom: 12,
                  fontWeight: i === 0 ? "bold" : "normal",
                  color: i === 0 ? "#2C2C2C" : "#2C2C2C",
                  fontSize: i === 0 ? 20 : 16,
                  background: i === 0 ? "rgba(245, 239, 224, 0.1)" : "transparent",
                  borderRadius: 8,
                  padding: i === 0 ? "12px 16px" : "8px 0",
                  border: i === 0 ? "1px solid rgba(255, 255, 255, 0.2)" : "none",
                  boxShadow: i === 0 ? "0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.1)" : "none",
                  transition: "all 0.3s ease",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                }}
              >
                <b>{displayRace}:</b> {points} points
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
export default UserList;
