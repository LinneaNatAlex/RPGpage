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

export default function AnnouncementBanner({ user }) {
  const [announcements, setAnnouncements] = useState([]);

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

  if (!announcements.length) return null;

  return (
    <div className={styles.bannerWrapper}>
      <div className={styles.marquee}>
        <span>
          {announcements.map((a, i) => (
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
                  ×
                </button>
              ) : null}
              {i < announcements.length - 1 && "  •  "}
            </React.Fragment>
          ))}
        </span>
      </div>
    </div>
  );
}
