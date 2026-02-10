import useUsers from "../../hooks/useUser";

export default function HousePoints() {
  const { users } = useUsers();
  // Collect points per house/race
  const houseTotals = {};
  users.forEach((u) => {
    const house = u.house || u.race || "Unknown";
    if (!houseTotals[house]) houseTotals[house] = 0;
    houseTotals[house] += u.points || 0;
  });
  // Topp brukere
  const topUsers = [...users]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 10);
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        background: "#23232b",
        color: "#fff",
        padding: 24,
        borderRadius: 0,
      }}
    >
      <h2>House Points</h2>
      <h3>Totals by House</h3>
      <ul>
        {Object.entries(houseTotals).map(([house, pts]) => (
          <li key={house} style={{ fontWeight: "bold", color: "#a084e8" }}>
            {house}: <span style={{ color: "#fff" }}>{pts}</span>
          </li>
        ))}
      </ul>
      <h3 style={{ marginTop: 24 }}>Top Students</h3>
      <ol>
        {topUsers.map((u) => (
          <li key={u.uid}>
            {u.displayName || u.name || u.email || u.uid} (
            {u.house || u.race || "?"}): <b>{u.points || 0}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}
