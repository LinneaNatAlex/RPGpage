import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import styles from "./AnnouncementAdmin.module.css";

export default function AnnouncementAdmin({ user }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  if (!user?.roles?.includes("admin") && !user?.roles?.includes("teacher"))
    return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!text.trim()) return setError("Message cannot be empty.");
    try {
      await addDoc(collection(db, "announcements"), {
        text,
        createdAt: serverTimestamp(),
        author: user.displayName || user.email || "admin",
      });
      setText("");
    } catch (err) {
      console.error("Failed to add announcement:", err);
      setError(
        "Failed to add announcement. Check your permissions and network."
      );
    }
  };

  return (
    <div className={styles.announcementAdminContainer}>
      <form onSubmit={handleAdd} className={styles.announcementForm}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="WRITE A NEW ANNOUNCEMENT FOR THE BANNER..."
        className={styles.announcementInput}
      />
      <button
        type="submit"
        className={styles.announcementButton}
      >
        Add
      </button>
      {error && (
        <span className={styles.errorMessage}>
          {error}
        </span>
      )}
      </form>
    </div>
  );
}
