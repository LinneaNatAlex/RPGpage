import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useAuth } from "../../context/authContext";
import useLibrary from "../../hooks/useLibrary";
import styles from "../BookEditor/BookEditor.module.css";
import editorStyles from "./LibraryEditor.module.css";

const isLikelyRawHtml = (str) => {
  if (!str || typeof str !== "string") return false;
  const t = str.trim();
  return t.startsWith("<") || /<(div|table|style|center)\s/i.test(str);
};

const LibraryEditor = ({ entry = null, existingCategories = [], onSave, onCancel }) => {
  const { user } = useAuth();
  const { addItem, updateItem } = useLibrary();
  const [title, setTitle] = useState(entry?.title || "");
  const [category, setCategory] = useState(entry?.category ?? "");
  const [content, setContent] = useState(entry?.content || "");
  const [useCustomHtml, setUseCustomHtml] = useState(() => isLikelyRawHtml(entry?.content));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry?.content !== undefined) {
      setContent(entry.content || "");
      setUseCustomHtml((prev) => (isLikelyRawHtml(entry.content) ? true : prev));
    }
    if (entry?.category !== undefined) setCategory(entry.category ?? "");
  }, [entry?.id, entry?.content, entry?.category]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a section title.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const data = { title: title.trim(), content: content || "", category: category.trim() || null };
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
        For tables, background images, and full HTML/CSS, use <strong>Custom HTML</strong> and paste your code – it will be saved and rendered exactly as you write it.
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
        <label>Category (optional)</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          list="library-categories"
          placeholder="e.g. Creatures, Rules, Tips"
          className={styles.input}
        />
        {existingCategories.length > 0 && (
          <datalist id="library-categories">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        )}
      </div>
      <div className={styles.formGroup}>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
            <input
              type="radio"
              name="libraryMode"
              checked={!useCustomHtml}
              onChange={() => setUseCustomHtml(false)}
            />
            Rich text
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
            <input
              type="radio"
              name="libraryMode"
              checked={useCustomHtml}
              onChange={() => setUseCustomHtml(true)}
            />
            Custom HTML (tables, background-image, full CSS)
          </label>
        </div>
        <label>Content</label>
        {useCustomHtml ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your full HTML/CSS here (e.g. &lt;center&gt;, &lt;table&gt;, background-image, borders). It will be rendered exactly as written – no need for {{code}}."
            className={editorStyles.rawHtmlTextarea}
            spellCheck={false}
          />
        ) : (
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
        )}
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
