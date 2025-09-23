// Imorting the function needed to fetch the users and the logic.
import { Link } from "react-router-dom";
import styles from "./UserList.module.css";
import useUsers from "../../hooks/useUser"; // Importing the custom hook to fetch users
import { auth } from "../../firebaseConfig";
import { getRaceColor, getRaceDisplayName } from "../../utils/raceColors";

const UserList = ({ userQuery }) => {
  const { users, loading } = useUsers(); //fetching the users from the costum useUsers hook

  // Hent innlogget bruker
  const currentUser = auth.currentUser;
  // Filter users by search query if provided and exclude current user
  const filteredUsers = (
    userQuery
      ? users.filter(
          (u) =>
            u.displayName?.toLowerCase().includes(userQuery.toLowerCase()) ||
            u.race?.toLowerCase().includes(userQuery.toLowerCase()) ||
            u.className?.toLowerCase().includes(userQuery.toLowerCase())
        )
      : users
  ).filter((u) => u.uid !== currentUser?.uid);

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
                idx === 0
                  ? {
                      background: "rgba(245, 239, 224, 0.2)",
                      fontWeight: "bold",
                    }
                  : {}
              }
            >
              <td data-label="Name">
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
                  else if (
                    user.roles?.some((r) => r.toLowerCase() === "archivist")
                  )
                    nameClass += ` ${styles.archivistName}`;
                  return <span className={nameClass}>{user.displayName}</span>;
                })()}
              </td>
              <td data-label="Race">
                {user.race && (
                  <span
                    style={{
                      color: getRaceColor(user.race),
                      fontWeight: "bold",
                      textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    {["Witch", "witch", "witches", "Witches"].includes(
                      user.race
                    )
                      ? "Wizard"
                      : user.race}
                  </span>
                )}
              </td>
              <td data-label="Class">{user.class}</td>
              <td
                data-label="Points"
                style={{
                  fontWeight: "bold",
                  color: idx === 0 ? "#2C2C2C" : "#2C2C2C",
                  fontSize: "1.1rem",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                }}
              >
                {user.points || 0}
              </td>
              <td data-label="Profile">
                <Link to={`/user/${user.uid}`} className={styles.profileLink}>
                  View Profile
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Race points summary - Simplified Design */}
      <div
        className={styles.racePointsContainer}
        style={{
          marginTop: 32,
          background: "linear-gradient(135deg, #E8DDD4 0%, #F5EFE0 100%)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
          border: "2px solid #7B6857",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            color: "#7B6857",
            fontSize: "1.8rem",
            marginBottom: 20,
            fontFamily: '"Cinzel", serif',
            letterSpacing: 1,
            fontWeight: 700,
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
          }}
        >
          Race Championship
        </h3>

        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {sortedRacePoints.map(([race, points], i) => {
            const displayRace = [
              "Witch",
              "witch",
              "witches",
              "Witches",
            ].includes(race)
              ? "Wizard"
              : race;

            const isFirst = i === 0;
            const isSecond = i === 1;
            const isThird = i === 2;

            return (
              <div
                key={race}
                style={{
                  background: isFirst
                    ? "linear-gradient(135deg, #E8DDD4 0%, #D4C4A8 100%)"
                    : isSecond
                    ? "linear-gradient(135deg, #D4C4A8 0%, #C4B29B 100%)"
                    : isThird
                    ? "linear-gradient(135deg, #C4B29B 0%, #B5A48E 100%)"
                    : "linear-gradient(135deg, #F5EFE0 0%, #E8DDD4 100%)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  border: isFirst
                    ? "2px solid #B5A48E"
                    : isSecond
                    ? "2px solid #A59488"
                    : isThird
                    ? "2px solid #95847B"
                    : "1px solid #7B6857",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  {isFirst && <span style={{ fontSize: "20px" }}>🥇</span>}
                  {isSecond && <span style={{ fontSize: "18px" }}>🥈</span>}
                  {isThird && <span style={{ fontSize: "18px" }}>🥉</span>}
                  <span
                    style={{
                      fontWeight: isFirst
                        ? 700
                        : isSecond
                        ? 600
                        : isThird
                        ? 600
                        : 500,
                      color: getRaceColor(race),
                      fontSize: isFirst
                        ? "1.2rem"
                        : isSecond
                        ? "1.1rem"
                        : isThird
                        ? "1.1rem"
                        : "1rem",
                      fontFamily: '"Cinzel", serif',
                      letterSpacing: 0.5,
                    }}
                  >
                    {displayRace}
                  </span>
                </div>
                <span
                  style={{
                    fontWeight: isFirst
                      ? 700
                      : isSecond
                      ? 600
                      : isThird
                      ? 600
                      : 500,
                    color: isFirst
                      ? "#2C2C2C"
                      : isSecond
                      ? "#2C2C2C"
                      : isThird
                      ? "#2C2C2C"
                      : "#7B6857",
                    fontSize: isFirst
                      ? "1.3rem"
                      : isSecond
                      ? "1.2rem"
                      : isThird
                      ? "1.1rem"
                      : "1rem",
                    fontFamily: '"Cinzel", serif',
                  }}
                >
                  {points.toLocaleString()} pts
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default UserList;
