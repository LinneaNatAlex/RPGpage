// importing necessary libraries and components
import style from "./HtmlCssExternal.module.css";

export default function HtmlCssExternal() {
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  // --------------------------IMPORTS--------------------------
  // Inline html and css editors, bad practice, but good for a learning experience, and it is in this cased use mainly for the role of 'admin'.

  const srcDoc = `
     <html>
        <style>${cssCode}</style>
        <body>${htmlCode}</body>
    </html>
    `;
  // --------------------------HTML EDITOR--------------------------
  return (
    <div className={style.wrapper}>
      <div className={style.editorContainer}>
        <h2>HTML</h2>
        <div className={style.editorWrapper}>
          <Editor
            language="html"
            value={htmlCode}
            onChange={(value) => setHtmlCode(value)}
          />
        </div>
        <h2>CSS</h2>
        <div className={style.editorWrapper}>
          <Editor
            language="css"
            height="100%"
            value={cssCode}
            onChange={(value) => setCssCode(value)}
          />
        </div>
        <h2>CSS</h2>
        <div className={style.editorWrapper}>
          <Editor
            language="css"
            height="100%"
            value={cssCode}
            onChange={(value) => setCssCode(value)}
          />
        </div>

        <div className={style.previewContainer}>
          <h3>Live Preview</h3>
          <iframe
            srcDoc={srcDoc}
            title="live-preview"
            sandbox="allow-same-origin allow-scripts"
            width="100%"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
