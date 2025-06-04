// imports the necessary modules and components.
import { useState } from "react";
import Button from "../Button/Button";
import useProfileText from "../../hooks/useProfileText";
import Editor from "@monaco-editor/react";
import styles from "./ProfileTextEditor.module.css";
import { useAuth } from "../../context/authContext";
// state variables and hooks to manage user profile text editing
const ProfileTextEditor = () => {
  const { user } = useAuth();

  const { text, storeText, loading, html, css, mode } = useProfileText();
  const [editing, setEditing] = useState(false);
  const [tempHtml, setTempHtml] = useState(html);
  const [tempCss, setTempCss] = useState(css);
  const [editMode, setEditMode] = useState(mode);
  const [tempText, setTempText] = useState(text);
  // loding while fetching the profile text
  if (loading) return <div>Loading...</div>;
  //
  const handleStoreText = () => {
    storeText(editMode, tempText, tempHtml, tempCss);
    setEditing(false);
  };
  // bad practice to use inline styles, but for the sake of this example, use it for the profile text editor. Its how the plugins work, apparently.
  const srcDoc = `
  <html>
    <style>${css}</style>
    <body>${html}</body>
  </html>
`;

  if (editing || (!text && !html)) {
    // --------------------------------------------HTML EDITOR--------------------------------------------
    return (
      <div className={styles.profileEditor}>
        <div>
          <label>
            <input
              type="radio"
              value="text"
              checked={editMode === "text"}
              onChange={(e) => setEditMode(e.target.value)}
            />
            Text
          </label>
          <label>
            <input
              type="radio"
              checked={editMode === "html"}
              onChange={(e) => setEditMode("html")}
            />
            HTML
          </label>
        </div>
        {editMode === "text" ? (
          <textarea
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            placeholder="Enter your profile text"
            rows={10}
            cols={50}
          />
        ) : (
          <>
            {/* HTML EDITOR */}
            <h2>HTML</h2>
            <div className={styles.editorWrapper}>
              <Editor
                language="html"
                value={tempHtml}
                onChange={(value) => setTempHtml(value)}
              />
            </div>
            {/* CSS EDITOR */}
            <h2>CSS</h2>
            <div className={styles.editorWrapper}>
              <Editor
                language="css"
                value={tempCss}
                onChange={(value) => setTempCss(value)}
              />
            </div>
          </>
        )}
        <br />
        <Button onClick={handleStoreText} className={styles.saveButton}>
          Save Profile
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      {mode === "text" ? (
        <p>{text}</p>
      ) : (
        <div className={styles.profilePreview}>
          <div className={styles.profileText}>
            <iframe
              className={styles.profileFrame}
              srcDoc={srcDoc}
              title="html-live-preview"
              sandbox=""
              width="100%"
              height="100%"
            />
            <Button
              className={styles.editButton}
              onClick={() => {
                setEditing(true);
                setEditMode(mode);
              }}
            >
              Edit Profile Text
            </Button>
          </div>
          {/* ----------------------------------------------- */}
        </div>
      )}
    </div>
  );
};
export default ProfileTextEditor;
