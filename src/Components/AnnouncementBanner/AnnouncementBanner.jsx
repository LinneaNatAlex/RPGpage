import React, { useEffect, useState } from "react";
import styles from "./AnnouncementBanner.module.css";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import useUsers from "../../hooks/useUser";

export default function AnnouncementBanner({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const { users } = useUsers();

  useEffect(() => {
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    setAnnouncements((prev) => prev.filter((a) => a.id !== id)); // Fjern lokalt umiddelbart
    await deleteDoc(doc(db, "announcements", id));
  };

  // Calculate race leader and top user
  const racePoints = {};
  users.forEach((u) => {
    if (!u.race) return;
    if (!racePoints[u.race]) racePoints[u.race] = 0;
    racePoints[u.race] += u.points || 0;
  });

  // Get race leader (race with most total points)
  const sortedRacePoints = Object.entries(racePoints).sort((a, b) => b[1] - a[1]);
  const raceLeader = sortedRacePoints.length > 0 ? sortedRacePoints[0] : null;

  // Get top user (user with most points)
  const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
  const topUser = sortedUsers.length > 0 ? sortedUsers[0] : null;

  // Always show banner, even if no announcements

  return (
    <div className={styles.bannerWrapper}>
      <div className={styles.bannerContent}>
        <div className={styles.marquee}>
          <span>
            {/* Display race leader and top user info */}
            {raceLeader && (
              <>
                ◈ Leading Race: {raceLeader[0]} ({raceLeader[1]} points)
                {topUser && "  •  "}
              </>
            )}
            {topUser && (
              <>
                ◆ Top Student: {topUser.displayName || topUser.name || topUser.email} ({topUser.points || 0} points)
                {announcements.length > 0 && "  •  "}
              </>
            )}
            
            {/* Display announcements */}
            {announcements.length > 0 ? (
              announcements.map((a, i) => (
                <React.Fragment key={a.id}>
                  {a.text}
                  {user?.roles?.includes("admin") ||
                  user?.roles?.includes("teacher") ? (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(a.id)}
                      style={{
                        marginLeft: 12,
                        background: "#e57373",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "2px 8px",
                        fontSize: "0.95em",
                        cursor: "pointer",
                      }}
                      title="Delete announcement"
                    >
                      ✕
                    </button>
                  ) : null}
                  {i < announcements.length - 1 && "  •  "}
                </React.Fragment>
              ))
            ) : (
              !raceLeader && !topUser && "News here"
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
