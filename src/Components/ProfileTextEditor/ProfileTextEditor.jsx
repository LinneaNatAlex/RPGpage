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
  const [tempBBCode, setTempBBCode] = useState("");
  // loding while fetching the profile text
  if (loading) return <div>Loading...</div>;
  //
  const handleStoreText = () => {
    storeText(editMode, tempText, tempHtml, tempCss, tempBBCode);
    setEditing(false);
  };

  // Enkel BBCode til HTML parser
  function parseBBCode(str) {
    if (!str) return "";
    return str
      .replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>')
      .replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>')
      .replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>')
      .replace(/\[color=(#[0-9a-fA-F]{3,6}|[a-zA-Z]+)\](.*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
      .replace(/\[size=(\d+)\](.*?)\[\/size\]/gi, '<span style="font-size:$1px">$2</span>')
      .replace(/\[url=(.*?)\](.*?)\[\/url\]/gi, '<a href="$1" target="_blank">$2</a>')
      .replace(/\n/g, '<br />');
  }
  // bad practice to use inline styles, but for the sake of this example, use it for the profile text editor. Its how the plugins work, apparently.
  const srcDoc = `
  <html>
    <style>${css}</style>
    <body>${html}</body>
  </html>
`;

  if (editing || (!text && !html)) {
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
              value="html"
              checked={editMode === "html"}
              onChange={() => setEditMode("html")}
            />
            HTML
          </label>
          <label>
            <input
              type="radio"
              value="bbcode"
              checked={editMode === "bbcode"}
              onChange={() => setEditMode("bbcode")}
            />
            BBCode
          </label>
        </div>
        {editMode === "text" && (
          <textarea
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            placeholder="Enter your profile text"
            rows={10}
            cols={50}
          />
        )}
        {editMode === "html" && (
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
        {editMode === "bbcode" && (
          <textarea
            value={tempBBCode}
            onChange={e => setTempBBCode(e.target.value)}
            placeholder="[b]Bold[/b] [i]Italic[/i] [color=red]Red[/color] osv."
            rows={10}
            cols={50}
          />
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
      {mode === "text" && <p>{text}</p>}
      {mode === "html" && (
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
        </div>
      )}
      {mode === "bbcode" && (
        <div className={styles.profilePreview}>
          <div className={styles.profileText}>
            <div dangerouslySetInnerHTML={{ __html: parseBBCode(tempBBCode) }} />
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
        </div>
      )}
    </div>
  );
};
export default ProfileTextEditor;
