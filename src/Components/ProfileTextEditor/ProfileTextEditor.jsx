// imports the necessary modules and components.
import { useState, useEffect } from "react";
import Button from "../Button/Button";
import useProfileText from "../../hooks/useProfileText";
import Editor from "@monaco-editor/react";
import styles from "./ProfileTextEditor.module.css";
import { useAuth } from "../../context/authContext";
// state variables and hooks to manage user profile text editing

const ProfileTextEditor = ({ initialMode, initialText, initialHtml, initialCss, initialBBCode, autoEdit, onSave }) => {
  // State and hooks
  const [editing, setEditing] = useState(autoEdit || false);
  const [editMode, setEditMode] = useState(null);
  const [tempText, setTempText] = useState("");
  const [tempHtml, setTempHtml] = useState("");
  const [tempCss, setTempCss] = useState("");
  const [tempBBCode, setTempBBCode] = useState("");

  // Get profile data and helpers from custom hook
  const { mode, text, html, css, bbcode, storeText } = useProfileText();
  
  // Use props if provided, otherwise use hook values
  const currentMode = initialMode || mode;
  const currentText = initialText !== undefined ? initialText : text;
  const currentHtml = initialHtml !== undefined ? initialHtml : html;
  const currentCss = initialCss !== undefined ? initialCss : css;
  const currentBBCode = initialBBCode !== undefined ? initialBBCode : bbcode;

  // Auto-enter edit mode if autoEdit is true
  useEffect(() => {
    if (autoEdit && currentMode) {
      setEditMode(currentMode);
      if (currentMode === "text") {
        setTempText(currentText || "");
      } else if (currentMode === "html") {
        setTempHtml(currentHtml || "");
        setTempCss(currentCss || "");
      } else if (currentMode === "bbcode") {
        setTempBBCode(currentBBCode || "");
      }
    }
  }, [autoEdit, currentMode, currentText, currentHtml, currentCss, currentBBCode]);

  // Helper for HTML preview
  const srcDoc = `<!DOCTYPE html><html><head><style>${currentCss}</style></head><body>${currentHtml}</body></html>`;

  // Utvidet BBCode-parser
  function parseBBCode(str) {
    if (!str) return "";
    // [plain]...[/plain] for å vise BBCode som tekst, og ikke parse videre
    let plainBlocks = [];
    let html = str.replace(
      /\[plain\]([\s\S]*?)\[\/plain\]/gi,
      function (_, code) {
        const key = `__PLAIN_BLOCK_${plainBlocks.length}__`;
        plainBlocks.push(
          '<span class="bbcode-plain">' +
            code
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/\n/g, "<br>") +
            "</span>"
        );
        return key;
      }
    );
    // Andre tagger
    html = html
      .replace(/\[b\](.*?)\[\/b\]/gis, "<strong>$1</strong>")
      .replace(/\[i\](.*?)\[\/i\]/gis, "<em>$1</em>")
      .replace(/\[u\](.*?)\[\/u\]/gis, "<u>$1</u>")
      .replace(/\[s\](.*?)\[\/s\]/gis, "<s>$1</s>")
      .replace(
        /\[color=(.*?)\](.*?)\[\/color\]/gis,
        '<span style="color:$1">$2</span>'
      )
      .replace(
        /\[size=(\d+)\](.*?)\[\/size\]/gis,
        '<span style="font-size:$1px">$2</span>'
      )
      .replace(
        /\[font=([\w\s\-]+)\](.*?)\[\/font\]/gis,
        '<span style="font-family:$1">$2</span>'
      )
      .replace(
        /\[center\](.*?)\[\/center\]/gis,
        '<div style="text-align:center">$1</div>'
      )
      .replace(
        /\[left\](.*?)\[\/left\]/gis,
        '<div style="text-align:left">$1</div>'
      )
      .replace(
        /\[right\](.*?)\[\/right\]/gis,
        '<div style="text-align:right">$1</div>'
      )
      .replace(
        /\[url=(.*?)\](.*?)\[\/url\]/gis,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>'
      )
      .replace(
        /\[img\](.*?)\[\/img\]/gis,
        '<img src="$1" alt="BBCode image" style="max-width:100%">'
      )
      // [video] tag: YouTube og MP4
      .replace(/\[video\](.*?)\[\/video\]/gis, function (_, url) {
        url = url.trim();
        // YouTube
        const yt = url.match(
          /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
        );
        if (yt) {
          return `<iframe width="420" height="236" src="https://www.youtube.com/embed/${yt[1]}" frameborder="0" allowfullscreen style="max-width:100%"></iframe>`;
        }
        // MP4
        if (url.match(/\.mp4($|\?)/i)) {
          return `<video controls style="max-width:100%"><source src="${url}" type="video/mp4"></video>`;
        }
        // fallback: bare vis lenken
        return `<a href="${url}" target="_blank">${url}</a>`;
      })
      .replace(/\[quote\](.*?)\[\/quote\]/gis, "<blockquote>$1</blockquote>")
      .replace(/\[code\]([\s\S]*?)\[\/code\]/gis, function (_, code) {
        return (
          "<pre><code>" +
          code.replace(/</g, "&lt;").replace(/>/g, "&gt;") +
          "</code></pre>"
        );
      });
    // [list]...[/list] parser kun [*] som listepunkt inne i listen
    html = html.replace(
      /\[list\]([\s\S]*?)\[\/list\]/gi,
      function (match, content) {
        // Ikke tolk nested [list]...[/list] i splitten
        let out = [];
        let buffer = "";
        let depth = 0;
        for (let i = 0; i < content.length; i++) {
          if (content.slice(i, i + 6).toLowerCase() === "[list]") {
            depth++;
            buffer += "[list]";
            i += 5;
            continue;
          }
          if (content.slice(i, i + 7).toLowerCase() === "[/list]") {
            depth--;
            buffer += "[/list]";
            i += 6;
            continue;
          }
          if (depth === 0 && content.slice(i, i + 3) === "[*]") {
            out.push(buffer);
            buffer = "";
            i += 2;
            continue;
          }
          buffer += content[i];
        }
        out.push(buffer);
        let items = out
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => `<li>${parseBBCode(item)}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
    );
    // [*] utenfor [list] vises som tekst
    html = html.replace(/\[\*\]/g, "&#91;*&#93;");
    // Konverter linjeskift til <br>, men ikke inne i <pre>...</pre>
    html = html.replace(/(<pre>[\s\S]*?<\/pre>)|\n/g, function (match, pre) {
      if (pre) return match;
      return "<br>";
    });
    // Sett inn [plain]-blokker igjen
    html = html.replace(
      /__PLAIN_BLOCK_(\d+)__/g,
      (_, idx) => plainBlocks[Number(idx)]
    );
    return html;
  }

  // Save handler
  const handleStoreText = async () => {
    if (editMode === "text") {
      await storeText("text", tempText, currentHtml, currentCss, currentBBCode);
    } else if (editMode === "html") {
      await storeText("html", currentText, tempHtml, tempCss, currentBBCode);
    } else if (editMode === "bbcode") {
      await storeText("bbcode", currentText, currentHtml, currentCss, tempBBCode);
    }
    setEditing(false);
    setEditMode(null);
    // Call onSave callback if provided
    if (onSave) onSave();
  };

  // If editing, show the editor UI
  if (editing) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.profilePreview}>
          <div className={styles.profileText}>
            <div className={styles.modeSelector}>
              <label>
                <input
                  type="radio"
                  name="profileMode"
                  value="text"
                    checked={editMode === "text"}
                    onChange={() => {
                      setEditMode("text");
                      setTempText(currentText || "");
                    }}
                />{" "}
                Text
              </label>
              <label>
                <input
                  type="radio"
                  name="profileMode"
                  value="html"
                    checked={editMode === "html"}
                    onChange={() => {
                      setEditMode("html");
                      setTempHtml(currentHtml || "");
                      setTempCss(currentCss || "");
                    }}
                />{" "}
                HTML/CSS
              </label>
              <label>
                <input
                  type="radio"
                  name="profileMode"
                  value="bbcode"
                    checked={editMode === "bbcode"}
                    onChange={() => {
                      setEditMode("bbcode");
                      setTempBBCode(currentBBCode || "");
                    }}
                />{" "}
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
                onChange={(e) => setTempBBCode(e.target.value)}
                placeholder="[b]Bold[/b] [i]Italic[/i] [color=red]Red[/color] osv."
                rows={10}
                cols={50}
              />
            )}
          </div>
        </div>
        <br />
        <Button onClick={handleStoreText} className={styles.saveButton}>
          Save Profile
        </Button>
      </div>
    );
  }

  // Not editing: show preview and always show edit button at the bottom
  return (
    <div className={styles.profileContainer}>
      <div className={styles.profilePreview}>
        <div className={styles.profileText}>
          {currentMode === "text" && (
            <div
              dangerouslySetInnerHTML={{
                __html: (currentText || "").replace(/\n/g, "<br>"),
              }}
            />
          )}
          {currentMode === "html" && (
            <iframe
              className={styles.profileFrame}
              srcDoc={srcDoc}
              title="html-live-preview"
              sandbox=""
              width="100%"
              height="100%"
            />
          )}
          {currentMode === "bbcode" &&
            (currentBBCode ? (
              <div dangerouslySetInnerHTML={{ __html: parseBBCode(currentBBCode) }} />
            ) : (
              <div
                style={{ color: "#888", fontStyle: "italic", margin: "1rem 0" }}
              >
                No BBCode profile text yet. Click edit to add!
              </div>
            ))}
        </div>
      </div>
      <Button
        className={styles.editButton}
        onClick={() => {
          setEditing(true);
          if (currentMode === "text") {
            setEditMode("text");
            setTempText(currentText || "");
          } else if (currentMode === "html") {
            setEditMode("html");
            setTempHtml(currentHtml || "");
            setTempCss(currentCss || "");
          } else if (currentMode === "bbcode") {
            setEditMode("bbcode");
            setTempBBCode(currentBBCode || "");
          }
        }}
        style={{ marginTop: "2rem", width: "100%" }}
      >
        Edit Profile Text
      </Button>
    </div>
  );

  return (
    <div className={styles.profileContainer}>
      {mode === "text" && (
        <div className={styles.profilePreview}>
          <div className={styles.profileText}>
            <p>{text}</p>
          </div>
          <Button
            className={styles.editButton}
            onClick={() => {
              setEditing(true);
              setEditMode("text");
              setTempText(text || "");
            }}
          >
            Edit Profile Text
          </Button>
        </div>
      )}
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
            {bbcode ? (
              <div dangerouslySetInnerHTML={{ __html: parseBBCode(bbcode) }} />
            ) : (
              <div
                style={{ color: "#888", fontStyle: "italic", margin: "1rem 0" }}
              >
                No BBCode profile text yet. Click edit to add!
              </div>
            )}
          </div>
          <Button
            className={styles.editButton}
            onClick={() => {
              setEditing(true);
              setEditMode("bbcode");
              setTempBBCode(bbcode || "");
            }}
          >
            Edit Profile Text
          </Button>
        </div>
      )}
    </div>
  );
};
export default ProfileTextEditor;
