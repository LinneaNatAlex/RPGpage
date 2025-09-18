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
      {/* Race points summary - Enhanced Design */}
      <div
        style={{
          marginTop: 40,
          background: "linear-gradient(135deg, #2C1810 0%, #3D2817 50%, #4A2F1A 100%)",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25), 0 6px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          border: "3px solid #8B4513",
          maxWidth: 600,
          marginLeft: "auto",
          marginRight: "auto",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative top border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #FFD700 0%, #FFA500 25%, #FF8C00 50%, #FFA500 75%, #FFD700 100%)",
            boxShadow: "0 2px 8px rgba(255, 215, 0, 0.4)",
          }}
        />
        
        {/* Magical sparkle effects */}
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            fontSize: "24px",
            color: "#FFD700",
            textShadow: "0 0 10px rgba(255, 215, 0, 0.8)",
            animation: "sparkle 2s infinite",
          }}
        >
          ✨
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            fontSize: "20px",
            color: "#FFD700",
            textShadow: "0 0 8px rgba(255, 215, 0, 0.6)",
            animation: "sparkle 2s infinite 1s",
          }}
        >
          ⭐
        </div>

        <h3 style={{ 
          marginBottom: 28, 
          color: "#FFD700", 
          letterSpacing: 2,
          fontFamily: '"Cinzel", serif',
          fontSize: "2.2rem",
          fontWeight: 800,
          textShadow: "0 3px 12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3)",
          position: "relative",
          zIndex: 2,
        }}>
          🏆 RACE CHAMPIONSHIP 🏆
        </h3>
        
        <div style={{ 
          display: "grid", 
          gap: 16, 
          marginTop: 24,
          position: "relative",
          zIndex: 2,
        }}>
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
                    ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
                    : isSecond
                    ? "linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)"
                    : isThird
                    ? "linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
                  borderRadius: 12,
                  padding: isFirst ? "16px 20px" : "12px 16px",
                  border: isFirst 
                    ? "2px solid #FF8C00"
                    : isSecond
                    ? "2px solid #808080"
                    : isThird
                    ? "2px solid #8B4513"
                    : "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: isFirst
                    ? "0 6px 20px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                    : isSecond
                    ? "0 4px 16px rgba(192, 192, 192, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                    : isThird
                    ? "0 4px 16px rgba(205, 127, 50, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                    : "0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                  transition: "all 0.3s ease",
                  transform: isFirst ? "scale(1.05)" : "scale(1)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Medal icons */}
                {isFirst && (
                  <div style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "24px",
                    textShadow: "0 0 10px rgba(255, 215, 0, 0.8)",
                  }}>
                    🥇
                  </div>
                )}
                {isSecond && (
                  <div style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "20px",
                    textShadow: "0 0 8px rgba(192, 192, 192, 0.6)",
                  }}>
                    🥈
                  </div>
                )}
                {isThird && (
                  <div style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "20px",
                    textShadow: "0 0 8px rgba(205, 127, 50, 0.6)",
                  }}>
                    🥉
                  </div>
                )}
                
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginLeft: isFirst || isSecond || isThird ? "40px" : "0",
                }}>
                  <span style={{
                    fontWeight: isFirst ? 800 : isSecond ? 700 : isThird ? 600 : 500,
                    color: isFirst ? "#2C2C2C" : isSecond ? "#2C2C2C" : isThird ? "#2C2C2C" : "#F5EFE0",
                    fontSize: isFirst ? "1.4rem" : isSecond ? "1.2rem" : isThird ? "1.1rem" : "1rem",
                    textShadow: isFirst ? "0 2px 4px rgba(0, 0, 0, 0.3)" : "0 1px 2px rgba(0, 0, 0, 0.2)",
                    fontFamily: '"Cinzel", serif',
                    letterSpacing: 1,
                  }}>
                    {displayRace}
                  </span>
                  <span style={{
                    fontWeight: isFirst ? 800 : isSecond ? 700 : isThird ? 600 : 500,
                    color: isFirst ? "#2C2C2C" : isSecond ? "#2C2C2C" : isThird ? "#2C2C2C" : "#FFD700",
                    fontSize: isFirst ? "1.6rem" : isSecond ? "1.4rem" : isThird ? "1.2rem" : "1.1rem",
                    textShadow: isFirst ? "0 2px 4px rgba(0, 0, 0, 0.3)" : "0 1px 2px rgba(0, 0, 0, 0.2)",
                    fontFamily: '"Cinzel", serif',
                    letterSpacing: 1,
                  }}>
                    {points.toLocaleString()} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* CSS Animation */}
        <style>{`
          @keyframes sparkle {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    </div>
  );
};
export default UserList;
