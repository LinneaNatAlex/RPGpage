import { useState } from "react";
import Button from "../Button/Button";
import useProfileText from "../../hooks/useProfileText";
import Editor from "@monaco-editor/react";
import styles from "./ProfileTextEditor.module.css";

const ProfileTextEditor = () => {
  const { text, storeText, loading, html, css, mode } = useProfileText();
  const [editing, setEditing] = useState(false);
  const [tempHtml, setTempHtml] = useState(html);
  const [tempCss, setTempCss] = useState(css);
  const [editMode, setEditMode] = useState(mode);
  const [tempText, setTempText] = useState(text);

  if (loading) return <div>Loading...</div>;

  const handleStoreText = () => {
    storeText(editMode, tempText, tempHtml, tempCss);
    setEditing(false);
  };

  const srcDoc = `
  <html>
    <style>${css}</style>
    <body>${html}</body>
  </html>
`;

  if (editing || (!text && !html)) {
    return (
      <div>
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
            <h2>HTML</h2>
            <div className={styles.editorWrapper}>
              <Editor
                language="html"
                value={tempHtml}
                onChange={(value) => setTempHtml(value)}
              />
            </div>

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
        <Button onClick={handleStoreText}>Save Profile</Button>
      </div>
    );
  }

  return (
    <div>
      {mode === "text" ? (
        <p>{text}</p>
      ) : (
        <iframe
          srcDoc={srcDoc}
          title="html-live-preview"
          sandbox=""
          width="100%"
          height="100%"
        />
      )}
      <Button
        onClick={() => {
          setEditing(true);
          setEditMode(mode);
        }}
      >
        Edit Profile Text
      </Button>
    </div>
  );
};
export default ProfileTextEditor;
