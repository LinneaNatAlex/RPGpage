import React, { useState, useEffect } from "react";
import ReactQuillWithSynonyms from "../ReactQuillWithSynonyms/ReactQuillWithSynonyms";
import "react-quill/dist/quill.snow.css";
import Button from "../Button/Button";
import useProfileText from "../../hooks/useProfileText";
import styles from "./ProfileTextEditor.module.css";

/**
 * Profile text editor – two modes:
 * 1) Rich text: bold, italic, colours, images etc. (for those who don't use HTML).
 * 2) Code: {{code}} ... {{/code}} for custom HTML/CSS (same as News).
 */
const ProfileTextEditor = ({ initialText, autoEdit, onSave }) => {
  const [editing, setEditing] = useState(autoEdit || false);
  const [mode, setMode] = useState("rich"); // "rich" | "code"
  const [richContent, setRichContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const { text, storeText } = useProfileText();
  const currentText = initialText !== undefined ? initialText : text;

  useEffect(() => {
    const raw = currentText || "";
    if (raw.startsWith("{{code}}")) {
      setCodeContent(raw);
      setRichContent(raw.replace("{{code}}", "").replace("{{/code}}", "").trim() || "");
      setMode("code");
    } else {
      setRichContent(raw);
      setCodeContent("");
      setMode("rich");
    }
  }, [currentText]);

  const getRawBody = (str) => (str || "").replace("{{code}}", "").replace("{{/code}}", "");

  const handleSave = async () => {
    const toStore = mode === "code" ? codeContent : richContent;
    await storeText("html", toStore);
    setEditing(false);
    if (onSave) onSave();
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["blockquote", "clean"],
    ],
  };

  if (editing) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.profilePreview}>
          <div className={styles.profileText}>
            <h2>Edit Profile Text</h2>

            <div className={styles.modeSelector}>
              <button
                type="button"
                onClick={() => {
                  if (mode === "code" && codeContent.trim()) {
                    setRichContent(getRawBody(codeContent).trim() || richContent);
                  }
                  setMode("rich");
                }}
                className={mode === "rich" ? styles.activeModeButton : styles.modeButton}
              >
                Rich text (bold, italic, colours, images)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mode === "rich" && richContent.trim()) {
                    setCodeContent(`{{code}}${richContent}{{/code}}`);
                  }
                  setMode("code");
                }}
                className={mode === "code" ? styles.activeModeButton : styles.modeButton}
              >
                Code ({"{{code}}"} for HTML)
              </button>
            </div>

            {mode === "rich" && (
              <div className={styles.editorWrapper}>
                <ReactQuillWithSynonyms
                  value={richContent}
                  onChange={setRichContent}
                  theme="snow"
                  modules={quillModules}
                  placeholder="Write your profile text here – use the toolbar for bold, italic, colours, images..."
                  className={styles.quillEditor}
                  enableSynonyms={true}
                />
              </div>
            )}

            {mode === "code" && (
              <>
                <p className={styles.codeHint}>
                  Same as News: type <code>{"{{code}}"}</code>, paste your HTML/CSS below, then <code>{"{{/code}}"}</code>.
                </p>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder={`{{code}}\n<style>\n  p { color: #2c2c2c; }\n</style>\n<p>Your profile text here...</p>\n{{/code}}`}
                  className={styles.codeOnlyEditor}
                  rows={16}
                />
              </>
            )}

            {(mode === "rich" ? richContent.trim() : codeContent.trim()) && (
              <div className={styles.codePreview}>
                <label className={styles.editorLabel}>Preview:</label>
                <iframe
                  title="Preview"
                  srcDoc={(() => {
                    const isDark =
                      typeof document !== "undefined" &&
                      !!document.querySelector('[data-theme="dark"]');
                    const bg = isDark ? "#1a1a1a" : "#f5efe0";
                    const fg = isDark ? "#e0e0e0" : "#2c2c2c";
                    const body = mode === "code" ? getRawBody(codeContent) : richContent;
                    return `<!DOCTYPE html>
<html style="background:${bg}">
<head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:1rem;background:${bg}!important;color:${fg};box-sizing:border-box;}*{box-sizing:inherit;}</style>
</head>
<body>${body}</body>
</html>`;
                  })()}
                  style={{
                    width: "100%",
                    minHeight: "200px",
                    border: "none",
                    borderRadius: 0,
                    background: (typeof document !== "undefined" && document.querySelector('[data-theme="dark"]')) ? "#1a1a1a" : "#f5efe0",
                  }}
                />
              </div>
            )}

            <div className={styles.buttonGroup}>
              <Button onClick={handleSave} className={styles.saveButton}>
                Save Profile
              </Button>
              <Button
                onClick={() => setEditing(false)}
                className={styles.cancelButton}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayBody = getRawBody(currentText) || currentText || "";

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profilePreview}>
        <div className={styles.profileText}>
          {currentText ? (
            <iframe
              srcDoc={(() => {
                const isDark =
                  typeof document !== "undefined" &&
                  !!document.querySelector('[data-theme="dark"]');
                const bg = isDark ? "#1a1a1a" : "#f5efe0";
                const fg = isDark ? "#e0e0e0" : "#2c2c2c";
                return `<!DOCTYPE html>
<html style="background:${bg}">
<head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:1rem;background:${bg}!important;color:${fg};box-sizing:border-box;}*{box-sizing:inherit;}</style>
</head>
<body>${displayBody}</body>
</html>`;
              })()}
              style={{
                width: "100%",
                minHeight: "200px",
                border: "none",
                borderRadius: 0,
                background: (typeof document !== "undefined" && document.querySelector('[data-theme="dark"]')) ? "#1a1a1a" : "#f5efe0",
              }}
              title="Profile Text"
              className={styles.htmlContent}
            />
          ) : (
            <div
              style={{ color: "#888", fontStyle: "italic", margin: "1rem 0" }}
            >
              No profile text yet. Click Edit – use rich text or {`{{code}}`} for HTML.
            </div>
          )}
          <Button
            className={styles.editButton}
            onClick={() => {
              setEditing(true);
              const raw = currentText || "";
              if (raw.startsWith("{{code}}")) {
                setCodeContent(raw);
                setRichContent(getRawBody(raw).trim() || "");
                setMode("code");
              } else {
                setRichContent(raw);
                setCodeContent("");
                setMode("rich");
              }
            }}
            style={{ marginTop: "2rem", width: "100%" }}
          >
            Edit Profile Text
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileTextEditor;
