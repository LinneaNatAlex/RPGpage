import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useAuth } from "../../context/authContext";
import useLibrary from "../../hooks/useLibrary";
import styles from "../BookEditor/BookEditor.module.css";
import editorStyles from "./LibraryEditor.module.css";

const LibraryEditor = ({ entry = null, onSave, onCancel }) => {
  const { user } = useAuth();
  const { addItem, updateItem } = useLibrary();
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a section title.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const data = { title: title.trim(), content: content || "" };
      if (entry) {
        await updateItem(entry.id, data);
      } else {
        await addItem({ ...data, createdBy: user.uid });
      }
      onSave?.();
    } catch (err) {
      alert(err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.bookEditor}>
      <h2>{entry ? "Edit library entry" : "New library entry"}</h2>
      <p style={{ color: "#D4C4A8", marginBottom: "1rem", fontSize: "0.95rem" }}>
        These appear on the public Library page (tips users should know). No purchase required.
        You can use the code buttons above, or type <code>{"{{code}}"}</code> … <code>{"{{/code}}"}</code> around HTML/code (same as Profile and News).
      </p>
      <div className={styles.formGroup}>
        <label>Section title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. About Vampires, Werewolf lore, How to format posts"
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Content</label>
        <div className={editorStyles.quillWrapper}>
          <ReactQuill
            value={content}
            onChange={setContent}
            theme="snow"
            placeholder="Write your tip or information here…"
            modules={{
              toolbar: [
                [{ header: [1, 2, false] }],
                ["bold", "italic", "underline", "strike"],
                ["code", "code-block"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["clean"],
              ],
            }}
            style={{ background: "transparent" }}
          />
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={styles.saveBtn}
          disabled={saving}
        >
          {saving ? "Saving…" : entry ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
};

export default LibraryEditor;
