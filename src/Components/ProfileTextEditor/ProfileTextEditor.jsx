import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactQuillWithSynonyms from "../ReactQuillWithSynonyms/ReactQuillWithSynonyms";
import "react-quill/dist/quill.snow.css";
import Button from "../Button/Button";
import useProfileText from "../../hooks/useProfileText";
import { bbcodeToHtml, htmlToBbcode } from "../../utils/bbcode";
import styles from "./ProfileTextEditor.module.css";

/**
 * Profile text editor – two modes:
 * 1) Rich text: bold, italic, colours, images etc. (for those who don't use HTML).
 * 2) Code: {{code}} ... {{/code}} for custom HTML/CSS (same as News).
 */
const ProfileTextEditor = ({ initialText, autoEdit, onSave }) => {
  const [editing, setEditing] = useState(autoEdit || false);
  const [mode, setMode] = useState("rich"); // "rich" | "code" | "bbcode"
  const [richContent, setRichContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [bbcodeContent, setBbcodeContent] = useState("");
  const quillEditorRef = useRef(null);
  const { text, storeText } = useProfileText();
  const currentText = initialText !== undefined ? initialText : text;

  useEffect(() => {
    const raw = currentText || "";
    if (raw.startsWith("{{code}}")) {
      setCodeContent(raw);
      setRichContent(raw.replace("{{code}}", "").replace("{{/code}}", "").trim() || "");
      setBbcodeContent(htmlToBbcode(getRawBody(raw)));
      setMode("code");
    } else {
      setRichContent(raw);
      setCodeContent("");
      setBbcodeContent(htmlToBbcode(raw));
      setMode("rich");
    }
  }, [currentText]);

  const getRawBody = (str) => (str || "").replace("{{code}}", "").replace("{{/code}}", "");

  const handleSave = async () => {
    let toStore;
    if (mode === "code") toStore = codeContent;
    else if (mode === "bbcode") toStore = bbcodeToHtml(bbcodeContent);
    else toStore = richContent;
    await storeText("html", toStore);
    setEditing(false);
    if (onSave) onSave();
  };

  const customImageHandler = useCallback(() => {
    const q = quillEditorRef.current;
    if (!q) return;
    const range = q.getSelection(true);
    if (!range) return;
    const url = prompt("Image URL:");
    if (!url || !url.trim()) return;
    const widthInput = prompt("Width (e.g. 200px, 50%, or leave blank for full width):", "");
    const alignInput = (prompt("Align: left, center, or right?", "center") || "center").trim().toLowerCase();
    const align = ["left", "center", "right"].includes(alignInput) ? alignInput : "center";
    const width = widthInput.trim();
    const wrapStyle = align === "center" ? "text-align:center;margin-left:auto;margin-right:auto" : align === "right" ? "text-align:right" : "text-align:left";
    const imgStyle = width ? `max-width:100%;height:auto;width:${width}` : "max-width:100%;height:auto";
    const html = `<p style="${wrapStyle}"><img src="${url.replace(/"/g, "&quot;")}" style="${imgStyle}" /></p>`;
    q.clipboard.dangerouslyPasteHTML(range.index, html);
    setTimeout(() => setRichContent(q.root.innerHTML), 0);
  }, []);

  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["blockquote", "clean"],
      ],
      handlers: { image: customImageHandler },
    },
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
                  if (mode === "code" && codeContent.trim()) setRichContent(getRawBody(codeContent).trim() || richContent);
                  if (mode === "bbcode" && bbcodeContent.trim()) setRichContent(bbcodeToHtml(bbcodeContent));
                  setMode("rich");
                }}
                className={mode === "rich" ? styles.activeModeButton : styles.modeButton}
              >
                Rich text (bold, italic, colours, images)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mode === "rich" && richContent.trim()) setBbcodeContent(htmlToBbcode(richContent));
                  if (mode === "code" && codeContent.trim()) setBbcodeContent(htmlToBbcode(getRawBody(codeContent)));
                  setMode("bbcode");
                }}
                className={mode === "bbcode" ? styles.activeModeButton : styles.modeButton}
              >
                BBCode
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mode === "rich" && richContent.trim()) setCodeContent(`{{code}}${richContent}{{/code}}`);
                  if (mode === "bbcode" && bbcodeContent.trim()) setCodeContent(`{{code}}${bbcodeToHtml(bbcodeContent)}{{/code}}`);
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
                  quillRef={quillEditorRef}
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

            {mode === "bbcode" && (
              <div className={styles.editorWrapper}>
                <textarea
                  value={bbcodeContent}
                  onChange={(e) => setBbcodeContent(e.target.value)}
                  placeholder="Use BBCode: [b]bold[/b], [i]italic[/i], [url=...]link[/url], [img]url[/img], [center]...[/center], [color=red]...[/color]"
                  className={styles.codeOnlyEditor}
                  rows={14}
                  style={{ minHeight: 280 }}
                />
                <p className={styles.codeHint}>
                  BBCode: [b], [i], [u], [s], [url=...], [img], [color=...], [size=...], [center], [left], [right], [code], [quote]
                </p>
              </div>
            )}

            {mode === "code" && (
              <>
                <p className={styles.codeHint}>
                  Same as News: type <code>{"{{code}}"}</code>, then add your HTML, CSS and/or JavaScript below, and close with <code>{"{{/code}}"}</code>. Scripts run inside the profile view.
                </p>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder={`{{code}}\n<style>\n  p { color: #2c2c2c; }\n</style>\n<p>Your profile text here...</p>\n<script>\n  // optional JavaScript\n</script>\n{{/code}}`}
                  className={styles.codeOnlyEditor}
                  rows={16}
                />
              </>
            )}

            {(mode === "rich" ? richContent.trim() : mode === "bbcode" ? bbcodeContent.trim() : codeContent.trim()) && (
              <div className={styles.codePreview}>
                <label className={styles.editorLabel}>Preview:</label>
                <iframe
                  title="Preview"
                  srcDoc={(() => {
                    const isDark =
                      typeof document !== "undefined" &&
                      !!document.querySelector('[data-theme="dark"]');
                    const bg = isDark ? "#1a1a1a" : "#EBE1D7";
                    const fg = isDark ? "#e0e0e0" : "#2c2c2c";
                    let body =
                      mode === "code" ? getRawBody(codeContent)
                      : mode === "bbcode" ? bbcodeToHtml(bbcodeContent)
                      : richContent;
                    body = body.replace(/(\s(?:src|href)\s*=\s*["'])http:\/\//gi, "$1https://");
                    const quillColors = `
.ql-color-white{color:#fff !important}.ql-color-red{color:#e60000 !important}.ql-color-orange{color:#f90 !important}.ql-color-yellow{color:#ff0 !important}.ql-color-green{color:#008a00 !important}.ql-color-blue{color:#06c !important}.ql-color-purple{color:#93f !important}
.ql-bg-black{background-color:#000 !important}.ql-bg-red{background-color:#e60000 !important}.ql-bg-orange{background-color:#f90 !important}.ql-bg-yellow{background-color:#ff0 !important}.ql-bg-green{background-color:#008a00 !important}.ql-bg-blue{background-color:#06c !important}.ql-bg-purple{background-color:#93f !important}
.ql-font-serif{font-family:Georgia,Times New Roman,serif !important}.ql-font-monospace{font-family:Monaco,Courier New,monospace !important}.ql-size-small{font-size:0.75em !important}.ql-size-large{font-size:1.5em !important}.ql-size-huge{font-size:2.5em !important}
.ql-align-center{text-align:center !important}.ql-align-right{text-align:right !important}.ql-align-justify{text-align:justify !important}
.ql-align-center img,.ql-align-right img{display:inline-block !important;vertical-align:middle;}
img{max-width:100% !important;height:auto !important;}`;
                    return `<!DOCTYPE html>
<html style="background:${bg}">
<head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:1rem;color:${fg};box-sizing:border-box;background:${bg};}*{box-sizing:inherit;}${quillColors}</style>
</head>
<body style="background:${bg}">${body}</body>
</html>`;
                  })()}
                  style={{
                    width: "100%",
                    minHeight: "200px",
                    border: "none",
                    borderRadius: 0,
                    background: "transparent",
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

  let displayBody = getRawBody(currentText) || currentText || "";
  displayBody = displayBody.replace(/(\s(?:src|href)\s*=\s*["'])http:\/\//gi, "$1https://");

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
                const bg = isDark ? "#1a1a1a" : "#EBE1D7";
                const fg = isDark ? "#e0e0e0" : "#2c2c2c";
                const imgCss = ".ql-align-center img,.ql-align-right img{display:inline-block;vertical-align:middle;} img{max-width:100%;height:auto;} p img{vertical-align:middle;}";
                return `<!DOCTYPE html>
<html style="background:${bg}">
<head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:1rem;color:${fg};box-sizing:border-box;background:${bg};}*{box-sizing:inherit;}${imgCss}</style>
</head>
<body style="background:${bg}">${displayBody}</body>
</html>`;
              })()}
              style={{
                width: "100%",
                minHeight: "200px",
                border: "none",
                borderRadius: 0,
                background: "transparent",
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
