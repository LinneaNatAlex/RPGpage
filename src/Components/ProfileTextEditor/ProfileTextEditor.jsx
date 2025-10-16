import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Button from "../Button/Button";
import useProfileText from "../../hooks/useProfileText";
import styles from "./ProfileTextEditor.module.css";

const ProfileTextEditor = ({ initialText, autoEdit, onSave }) => {
  const [editing, setEditing] = useState(autoEdit || false);
  const [tempText, setTempText] = useState("");
  const [tempCss, setTempCss] = useState("");
  const [editorMode, setEditorMode] = useState("rich"); // "rich" or "html"
  const { text, storeText } = useProfileText();
  const currentText = initialText !== undefined ? initialText : text;

  useEffect(() => {
    if (initialText !== undefined) {
      // Separate CSS and HTML if they exist together
      const styleMatch = initialText.match(/<style>(.*?)<\/style>/s);
      if (styleMatch) {
        setTempCss(styleMatch[1]);
        setTempText(initialText.replace(/<style>.*?<\/style>/s, "").trim());
      } else {
        setTempText(initialText);
        setTempCss("");
      }
    }
  }, [initialText]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      [{ font: [] }],
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["link", "image", "video"],
      ["blockquote", "code-block"],
      ["clean"],
    ],
  };

  const handleStoreText = async () => {
    if (editorMode === "html") {
      // For HTML mode, combine HTML and CSS
      const finalHtml = tempCss
        ? `<style>${tempCss}</style>${tempText}`
        : tempText;
      await storeText("html", finalHtml);
    } else {
      // For rich text mode, store as is
      await storeText("html", tempText);
    }
    setEditing(false);
    if (onSave) onSave();
  };

  if (editing) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.profilePreview}>
          <div className={styles.profileText}>
            <h2>Edit Profile Text</h2>

            {/* Mode Selector */}
            <div className={styles.modeSelector}>
              <button
                onClick={() => setEditorMode("rich")}
                className={
                  editorMode === "rich"
                    ? styles.activeModeButton
                    : styles.modeButton
                }
              >
                Rich Text Editor
              </button>
              <button
                onClick={() => setEditorMode("html")}
                className={
                  editorMode === "html"
                    ? styles.activeModeButton
                    : styles.modeButton
                }
              >
                HTML/CSS Editor
              </button>
            </div>

            {/* Rich Text Editor */}
            {editorMode === "rich" && (
              <div className={styles.editorWrapper}>
                <ReactQuill
                  value={tempText}
                  onChange={setTempText}
                  theme="snow"
                  modules={modules}
                  placeholder="Write your profile text here..."
                  className={styles.quillEditor}
                />
              </div>
            )}

            {/* HTML/CSS Editor */}
            {editorMode === "html" && (
              <div className={styles.htmlEditorWrapper}>
                <div className={styles.htmlEditorContainer}>
                  <div className={styles.codeEditorsRow}>
                    <div className={styles.htmlEditorColumn}>
                      <label className={styles.editorLabel}>HTML:</label>
                      <textarea
                        value={tempText}
                        onChange={(e) => setTempText(e.target.value)}
                        placeholder="<h1>Min overskrift</h1>&#10;<p>Min tekst her...</p>"
                        className={styles.htmlEditor}
                        rows={12}
                      />
                    </div>

                    <div className={styles.cssEditorColumn}>
                      <label className={styles.editorLabel}>
                        CSS (Optional):
                      </label>
                      <textarea
                        value={tempCss}
                        onChange={(e) => setTempCss(e.target.value)}
                        placeholder="/* Legg til dine CSS-stiler her */&#10;h1 { color: red; text-align: center; }&#10;p { color: #2c2c2c; }"
                        className={styles.cssEditor}
                        rows={12}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.previewContainer}>
                  <label className={styles.editorLabel}>Live Preview:</label>
                  <div className={styles.htmlPreview}>
                    {tempText || tempCss ? (
                      <iframe
                        srcDoc={`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <style>
                              body { margin: 0; padding: 1rem; font-family: Arial, sans-serif; }
                              ${tempCss}
                            </style>
                          </head>
                          <body>
                            ${tempText}
                          </body>
                          </html>
                        `}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                          borderRadius: "4px",
                        }}
                        title="Preview"
                      />
                    ) : (
                      <div className={styles.emptyPreview}>
                        Skriv HTML-kode ovenfor for å se preview her...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <br />
            <div className={styles.buttonGroup}>
              <Button onClick={handleStoreText} className={styles.saveButton}>
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

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profilePreview}>
        <div className={styles.profileText}>
          {currentText ? (
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { 
                      margin: 0; 
                      padding: 1rem; 
                      font-family: "Cinzel", serif;
                      color: #cd853f; /* Strong golden brown for unformatted text */
                      line-height: 1.6;
                      background: transparent;
                    }
                  </style>
                </head>
                <body>
                  ${currentText}
                </body>
                </html>
              `}
              style={{
                width: "100%",
                height: "1100px",
                border: "none",
                borderRadius: "8px",
                background: "transparent",
              }}
              title="Profile Text"
              className={styles.htmlContent}
            />
          ) : (
            <div
              style={{ color: "#888", fontStyle: "italic", margin: "1rem 0" }}
            >
              No profile text yet. Click edit to add!
            </div>
          )}
        </div>
      </div>
      <Button
        className={styles.editButton}
        onClick={() => {
          setEditing(true);
          // Separate CSS and HTML when opening editor
          const styleMatch = (currentText || "").match(
            /<style>(.*?)<\/style>/s
          );
          if (styleMatch) {
            setTempCss(styleMatch[1]);
            setTempText(
              (currentText || "").replace(/<style>.*?<\/style>/s, "").trim()
            );
          } else {
            setTempText(currentText || "");
            setTempCss("");
          }
        }}
        style={{ marginTop: "2rem", width: "100%" }}
      >
        Edit Profile Text
      </Button>
    </div>
  );
};

export default ProfileTextEditor;
