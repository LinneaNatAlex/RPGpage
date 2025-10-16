// Importing the function needed to fetch the users and the logic.
import { Link } from "react-router-dom";
import styles from "./UserList.module.css";
import useUsers from "../../hooks/useUser"; // Importing the custom hook to fetch users
import { auth } from "../../firebaseConfig";
import { getRaceColor, getRaceDisplayName } from "../../utils/raceColors";
import { useAuth } from "../../context/authContext";

const UserList = ({ userQuery }) => {
  const { users, loading } = useUsers(); //fetching the users from the costum useUsers hook with REAL-TIME updates
  const { user: authUser } = useAuth();

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

    // Function to format location text properly
    const formatLocation = (location) => {
      if (!location) return "Walking around school";

      // Handle user profile visits - extract user ID from URL
      if (location.includes('/user/')) {
        const userId = location.split('/user/')[1];
        // Find the user being visited
        const visitedUser = users.find(u => u.uid === userId);
        if (visitedUser) {
          return `Visiting ${visitedUser.displayName}'s room`;
        }
        return `Visiting someone's room`;
      }

      // Handle other locations
      const locationMap = {
        '/': 'Main Hall',
        '/forum': 'Forum',
        '/shop': 'Shop',
        '/inventory': 'Inventory',
        '/profile': 'Own Room',
        '/rpg': 'RPG Area',
        '/house-points': 'House Points Hall',
        '/classrooms': 'Classrooms',
        '/teacher': 'Teacher Area'
      };

      return locationMap[location] || location.replace('/', '').replace('-', ' ') || "Walking around school";
    };

    // If user has a current location and is recently active, show it
    if (user.currentLocation && isRecentlyActive) {
      return formatLocation(user.currentLocation);
    }

    // If user has a current location but isn't super recently active, still show it if within 10 minutes
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const isWithinRange = user.lastSeen && user.lastSeen > tenMinutesAgo;

    if (user.currentLocation && isWithinRange) {
      return formatLocation(user.currentLocation) + " (recently)";
    }

    // If user was seen but not recently, show as sleeping/taking a nap
    if (user.lastSeen && !isWithinRange) {
      // Randomly choose between sleeping or taking a nap for variety
      const sleepTexts = ["Sleeping", "Taking a nap", "Resting"];
      const randomSleepText = sleepTexts[Math.floor(Math.random() * sleepTexts.length)];
      return randomSleepText;
    }

    // If no lastSeen data, show as sleeping
    return "Sleeping";
  };

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
                    style={{ color: getRaceColor(race) }}
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
