// Importing the function needed to fetch the users and the logic.
import { Link } from "react-router-dom";
import { useState } from "react";
import styles from "./UserList.module.css";
import useUsers from "../../hooks/useUser"; // Importing the custom hook to fetch users
import { auth } from "../../firebaseConfig";
import { getRaceColor, getRaceDisplayName } from "../../utils/raceColors";
import { useAuth } from "../../context/authContext";

const UserList = ({ userQuery }) => {
  const { users, loading } = useUsers(); //fetching the users from the costum useUsers hook with REAL-TIME updates
  const { user: authUser } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Hent innlogget bruker
  const currentUser = auth.currentUser;

  // Check if current user has surveillance potion active
  const hasSurveillanceActive =
    authUser?.surveillanceUntil && authUser.surveillanceUntil > Date.now();


  // Function to get user location based on their activity
  const getUserLocation = (user) => {
    if (!hasSurveillanceActive) return null;

    // Check if user was recently seen (last 2 minutes instead of 5)
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    const isRecentlyActive = user.lastSeen && user.lastSeen > twoMinutesAgo;

    // If user has a current location and is recently active, show it
    if (user.currentLocation && isRecentlyActive) {
      return user.currentLocation;
    }

    // If user has a current location but isn't super recently active, still show it if within 10 minutes
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const isWithinRange = user.lastSeen && user.lastSeen > tenMinutesAgo;

    if (user.currentLocation && isWithinRange) {
      return user.currentLocation + " (recently)";
    }

    // If user was seen but not recently, show as offline
    if (user.lastSeen && !isWithinRange) {
      return "Left the school";
    }

    // If no lastSeen data, show as offline
    return "Left the school";
  };

  // Filter users by search query if provided; include current user so they can see themselves
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
  
  // Pagination logic
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = sortedUsers.slice(startIndex, endIndex);
  
  // Sort races by total points descending
  const sortedRacePoints = Object.entries(racePoints).sort(
    (a, b) => b[1] - a[1]
  );

  // Show loading state
  if (loading) {
    return (
      <div className={styles.userListWrapper}>
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "#7b6857",
            fontSize: "1.2rem",
          }}
        >
          Loading users... 🔄
        </div>
      </div>
    );
  }

  // Show empty state
  if (!loading && users.length === 0) {
    return (
      <div className={styles.userListWrapper}>
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "#7b6857",
            fontSize: "1.1rem",
          }}
        >
          <p>No users found. 🤔</p>
          <p>Check console for debugging info.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.userListWrapper}>
      <table className={styles.userListContainer}>
        <thead>
          <tr className={styles.tableHeader}>
            <th scope="col">Student/Teacher</th>
            <th scope="col">Location</th>
            <th scope="col">Race</th>
            <th scope="col">Class</th>
            <th scope="col">Points</th>
            <th scope="col">Profile</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user, idx) => {
            const isCurrentUser = user.uid === currentUser?.uid;
            return (
            <tr
              key={user.uid}
              className={isCurrentUser ? styles.currentUserRow : undefined}
              style={
                idx === 0 && !isCurrentUser
                  ? {
                      background: "rgba(245, 239, 224, 0.2)",
                      fontWeight: "bold",
                    }
                  : isCurrentUser
                  ? {
                      background: "rgba(123, 104, 87, 0.25)",
                      borderLeft: "4px solid #7b6857",
                      fontWeight: "bold",
                    }
                  : {}
              }
            >
              <td data-label="Name">
                {(() => {
                  let nameClass = styles.userName;
                  let dataRole = null;
                  if (user.roles?.some((r) => r.toLowerCase() === "headmaster")) {
                    nameClass += ` ${styles.headmasterName}`;
                    dataRole = "headmaster";
                  } else if (
                    user.roles?.some((r) => (r || "").toLowerCase() === "professor" || (r || "").toLowerCase() === "teacher")
                  ) {
                    nameClass += ` ${styles.professorName}`;
                    dataRole = "professor";
                  } else if (user.roles?.some((r) => r.toLowerCase() === "shadowpatrol")) {
                    nameClass += ` ${styles.shadowPatrolName}`;
                    dataRole = "shadowpatrol";
                  } else if (user.roles?.some((r) => r.toLowerCase() === "admin")) {
                    nameClass += ` ${styles.adminName}`;
                    dataRole = "admin";
                  } else if (user.roles?.some((r) => r.toLowerCase() === "archivist")) {
                    nameClass += ` ${styles.archivistName}`;
                    dataRole = "archivist";
                  }
                  return (
                    <span className={nameClass} data-role={dataRole}>
                      {user.displayName}
                    </span>
                  );
                })()}
              </td>
              <td data-label="Location" className={styles.locationCell}>
                {hasSurveillanceActive ? (
                  <span
                    className={
                      getUserLocation(user)?.includes("Left the school")
                        ? styles.locationOffline
                        : styles.locationActive
                    }
                  >
                    {getUserLocation(user)}
                  </span>
                ) : (
                  <span className={styles.locationHidden}>Hidden</span>
                )}
              </td>
              <td data-label="Race" className={styles.raceCell}>
                {user.race && (
                  <span
                    className={styles.raceValue}
                    data-race={(user.race || "").toLowerCase()}
                    style={{
                      color: getRaceColor(user.race),
                      fontWeight: "bold",
                      textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
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
              <td data-label="Points" className={styles.pointsCell}>
                {user.points ?? 0}
              </td>
              <td data-label="Profile">
                {isCurrentUser ? (
                  <span className={styles.youHere}>—</span>
                ) : (
                  <Link to={`/user/${user.uid}`} className={styles.profileLink}>
                    View Profile
                  </Link>
                )}
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            ← Previous
          </button>
          
          <div className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
            <span className={styles.userCount}>
              ({sortedUsers.length} users total)
            </span>
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next →
          </button>
        </div>
      )}
      
      {/* Race Championship - Clean Design */}
      <div className={styles.raceChampionship}>
        <h3 className={styles.championshipTitle}>Race Championship</h3>
        <div className={styles.leaderboard}>
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
                className={`${styles.leaderboardItem} ${
                  isFirst ? styles.first : isSecond ? styles.second : isThird ? styles.third : styles.other
                }`}
              >
                <div className={styles.raceInfo}>
                  {isFirst && <span className={styles.medal}>🥇</span>}
                  {isSecond && <span className={styles.medal}>🥈</span>}
                  {isThird && <span className={styles.medal}>🥉</span>}
                  <span 
                    className={styles.raceName}
                    data-race={(race || "").toLowerCase()}
                    style={{ 
                      color: getRaceColor(race),
                      fontWeight: "bold",
                      textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)"
                    }}
                  >
                    {displayRace}
                  </span>
                </div>
                <span className={styles.points}>{points.toLocaleString()} PTS</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default UserList;
