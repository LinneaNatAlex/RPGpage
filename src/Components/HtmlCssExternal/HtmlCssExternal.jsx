export default function HtmlCssExternal() {
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");

  const srcDoc = `
     <html>
        <style>${cssCode}</style>
        <body>${htmlCode}</body>
    </html>
    `;

  return (
    <div className={styles.wrapper}>
      <div className={styles.editorContainer}>
        <h2>HTML</h2>
        <Editor
          language="html"
          value={htmlCode}
          onChange={(value) => setHtmlCode(value)}
        />
        <h2>CSS</h2>
        <Editor
          language="css"
          value={cssCode}
          onChange={(value) => setCssCode(value)}
        />

        <div className={styles.previewContainer}>
          <h3></h3>
          <iframe
            srcDoc={srcDoc}
            title="live-preview"
            sandbox="allow-same-origin"
            width="100%"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
