import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";

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
    <form
      onSubmit={handleAdd}
      style={{
        margin: "1rem 0",
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a new announcement for the banner..."
        style={{
          flex: 1,
          padding: 8,
          borderRadius: 6,
          border: "1.5px solid #b8a48a",
          background: "#23232b",
          color: "#fffbe7",
          fontSize: "1rem",
          outline: "none",
        }}
      />
      <button
        type="submit"
        style={{
          background: "#b8a48a",
          color: "#23232b",
          border: "none",
          borderRadius: 6,
          padding: "8px 20px",
          fontWeight: 700,
          fontSize: "1rem",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        Add
      </button>
      {error && (
        <span
          style={{
            color: "#e57373",
            background: "#23232b",
            borderRadius: 4,
            padding: "4px 10px",
            marginLeft: 8,
            fontWeight: 600,
          }}
        >
          {error}
        </span>
      )}
    </form>
  );
}
