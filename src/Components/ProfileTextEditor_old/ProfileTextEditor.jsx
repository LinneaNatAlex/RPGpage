import React from "react";// Rich text profile editor using React Quill// Rich text profile editor using React Quill// imports the necessary modules and components.



const ProfileTextEditor = () => {import { useState, useEffect } from "react";

  return <div>New Profile Editor</div>;

};import ReactQuill from "react-quill";import { useState, useEffect } from "react";import { useState, useEffect } from "react";



export default ProfileTextEditor;import "react-quill/dist/quill.snow.css";

import Button from "../Button/Button";import ReactQuill from "react-quill";import Button from "../Button/Button";

import useProfileText from "../../hooks/useProfileText";

import styles from "./ProfileTextEditor.module.css";import "react-quill/dist/quill.snow.css";import useProfileText from "../../hooks/useProfileText";

import { useAuth } from "../../context/authContext";

import Button from "../Button/Button";import Editor from "@monaco-editor/react";

const ProfileTextEditor = ({ initialText, autoEdit, onSave }) => {

  // State and hooksimport useProfileText from "../../hooks/useProfileText";import styles from "./ProfileTextEditor.module.css";

  const [editing, setEditing] = useState(autoEdit || false);

  const [tempText, setTempText] = useState("");import styles from "./ProfileTextEditor.module.css";import { useAuth } from "../../context/authContext";



  // Get profile data and helpers from custom hookimport { useAuth } from "../../context/authContext";import parseBBCode from "./parseBBCode.js";

  const { text, storeText } = useProfileText();

  const { user } = useAuth();// state variables and hooks to manage user profile text editing



  // Current values (either from props or hook)const ProfileTextEditor = ({ initialText, autoEdit, onSave }) => {

  const currentText = initialText !== undefined ? initialText : text;

  // State and hooksconst ProfileTextEditor = ({

  // Set initial values when component mounts or props change

  useEffect(() => {  const [editing, setEditing] = useState(autoEdit || false);  initialMode,

    if (initialText !== undefined) {

      setTempText(initialText);  const [tempText, setTempText] = useState("");  initialText,

    }

  }, [initialText]);  initialHtml,



  // React Quill modules configuration  // Get profile data and helpers from custom hook  initialCss,

  const modules = {

    toolbar: [  const { text, storeText } = useProfileText();  initialBBCode,

      [{ header: [1, 2, 3, false] }],

      [{ font: [] }],  const { user } = useAuth();  autoEdit,

      [{ size: ["small", false, "large", "huge"] }],

      ["bold", "italic", "underline", "strike"],  onSave,

      [{ color: [] }, { background: [] }],

      [{ align: [] }],  // Current values (either from props or hook)}) => {

      [{ list: "ordered" }, { list: "bullet" }],

      [{ indent: "-1" }, { indent: "+1" }],  const currentText = initialText !== undefined ? initialText : text;  // State and hooks

      ["link", "image", "video"],

      ["blockquote", "code-block"],  const [editing, setEditing] = useState(autoEdit || false);

      ["clean"],

    ],  // Set initial values when component mounts or props change  const [editMode, setEditMode] = useState(null);

  };

  useEffect(() => {  const [tempText, setTempText] = useState("");

  const formats = [

    "header", "font", "size",    if (initialText !== undefined) {  const [tempHtml, setTempHtml] = useState("");

    "bold", "italic", "underline", "strike",

    "color", "background",      setTempText(initialText);  const [tempCss, setTempCss] = useState("");

    "align",

    "list", "bullet", "indent",    }  const [tempBBCode, setTempBBCode] = useState("");

    "link", "image", "video",

    "blockquote", "code-block"  }, [initialText]);

  ];

  // Get profile data and helpers from custom hook

  // Save handler

  const handleStoreText = async () => {  // React Quill modules configuration  const { mode, text, html, css, bbcode, storeText } = useProfileText();

    await storeText("html", tempText, tempText, "", "");

    setEditing(false);  const modules = {

    // Call onSave callback if provided

    if (onSave) onSave();    toolbar: [  // Use props if provided, otherwise use hook values

  };

      [{ header: [1, 2, 3, false] }],  const currentMode = initialMode || mode;

  // If editing, show the editor UI

  if (editing) {      [{ font: [] }],  const currentText = initialText !== undefined ? initialText : text;

    return (

      <div className={styles.profileContainer}>      [{ size: ["small", false, "large", "huge"] }],  const currentHtml = initialHtml !== undefined ? initialHtml : html;

        <div className={styles.profilePreview}>

          <div className={styles.profileText}>      ["bold", "italic", "underline", "strike"],  const currentCss = initialCss !== undefined ? initialCss : css;

            <h2>Edit Profile Text</h2>

            <div className={styles.editorWrapper}>      [{ color: [] }, { background: [] }],  const currentBBCode = initialBBCode !== undefined ? initialBBCode : bbcode;

              <ReactQuill

                value={tempText}      [{ align: [] }],

                onChange={setTempText}

                theme="snow"      [{ list: "ordered" }, { list: "bullet" }],  // Auto-enter edit mode if autoEdit is true

                modules={modules}

                formats={formats}      [{ indent: "-1" }, { indent: "+1" }],  useEffect(() => {

                placeholder="Write your profile text here..."

                className={styles.quillEditor}      ["link", "image", "video"],    if (autoEdit && currentMode) {

              />

            </div>      ["blockquote", "code-block"],      setEditMode(currentMode);

            <br />

            <div className={styles.buttonGroup}>      ["clean"],      if (currentMode === "text") {

              <Button onClick={handleStoreText} className={styles.saveButton}>

                Save Profile    ],        setTempText(currentText || "");

              </Button>

              <Button   };      } else if (currentMode === "html") {

                onClick={() => setEditing(false)} 

                className={styles.cancelButton}        setTempHtml(currentHtml || "");

              >

                Cancel  const formats = [        setTempCss(currentCss || "");

              </Button>

            </div>    "header", "font", "size",      } else if (currentMode === "bbcode") {

          </div>

        </div>    "bold", "italic", "underline", "strike",        setTempBBCode(currentBBCode || "");

      </div>

    );    "color", "background",      }

  }

    "align",    }

  // Not editing: show preview and edit button

  return (    "list", "bullet", "indent",  }, [

    <div className={styles.profileContainer}>

      <div className={styles.profilePreview}>    "link", "image", "video",    autoEdit,

        <div className={styles.profileText}>

          {currentText ? (    "blockquote", "code-block"    currentMode,

            <div 

              dangerouslySetInnerHTML={{ __html: currentText }}  ];    currentText,

              className={styles.htmlContent}

            />    currentHtml,

          ) : (

            <div  // Save handler    currentCss,

              style={{ color: "#888", fontStyle: "italic", margin: "1rem 0" }}

            >  const handleStoreText = async () => {    currentBBCode,

              No profile text yet. Click edit to add!

            </div>    await storeText("html", tempText, tempText, "", "");  ]);

          )}

        </div>    setEditing(false);

      </div>

      <Button    // Call onSave callback if provided  // Helper for HTML preview

        className={styles.editButton}

        onClick={() => {    if (onSave) onSave();  const srcDoc = `<!DOCTYPE html><html><head><style>${currentCss}</style></head><body>${currentHtml}</body></html>`;

          setEditing(true);

          setTempText(currentText || "");  };

        }}

        style={{ marginTop: "2rem", width: "100%" }}  // Save handler

      >

        Edit Profile Text  // If editing, show the editor UI  const handleStoreText = async () => {

      </Button>

    </div>  if (editing) {    if (editMode === "text") {

  );

};    return (      await storeText("text", tempText, currentHtml, currentCss, currentBBCode);



export default ProfileTextEditor;      <div className={styles.profileContainer}>    } else if (editMode === "html") {

        <div className={styles.profilePreview}>      await storeText("html", currentText, tempHtml, tempCss, currentBBCode);

          <div className={styles.profileText}>    } else if (editMode === "bbcode") {

            <h2>Edit Profile Text</h2>      await storeText(

            <div className={styles.editorWrapper}>        "bbcode",

              <ReactQuill        currentText,

                value={tempText}        currentHtml,

                onChange={setTempText}        currentCss,

                theme="snow"        tempBBCode

                modules={modules}      );

                formats={formats}    }

                placeholder="Write your profile text here..."    setEditing(false);

                className={styles.quillEditor}    setEditMode(null);

              />    // Call onSave callback if provided

            </div>    if (onSave) onSave();

            <br />  };

            <div className={styles.buttonGroup}>

              <Button onClick={handleStoreText} className={styles.saveButton}>  // If editing, show the editor UI

                Save Profile  if (editing) {

              </Button>    return (

              <Button       <div className={styles.profileContainer}>

                onClick={() => setEditing(false)}         <div className={styles.profilePreview}>

                className={styles.cancelButton}          <div className={styles.profileText}>

              >            <div className={styles.modeSelector}>

                Cancel              <label>

              </Button>                <input

            </div>                  type="radio"

          </div>                  name="profileMode"

        </div>                  value="text"

      </div>                  checked={editMode === "text"}

    );                  onChange={() => {

  }                    setEditMode("text");

                    setTempText(currentText || "");

  // Not editing: show preview and edit button                  }}

  return (                />{" "}

    <div className={styles.profileContainer}>                Text

      <div className={styles.profilePreview}>              </label>

        <div className={styles.profileText}>              <label>

          {currentText ? (                <input

            <div                   type="radio"

              dangerouslySetInnerHTML={{ __html: currentText }}                  name="profileMode"

              className={styles.htmlContent}                  value="html"

            />                  checked={editMode === "html"}

          ) : (                  onChange={() => {

            <div                    setEditMode("html");

              style={{ color: "#888", fontStyle: "italic", margin: "1rem 0" }}                    setTempHtml(currentHtml || "");

            >                    setTempCss(currentCss || "");

              No profile text yet. Click edit to add!                  }}

            </div>                />{" "}

          )}                HTML/CSS

        </div>              </label>

      </div>              <label>

      <Button                <input

        className={styles.editButton}                  type="radio"

        onClick={() => {                  name="profileMode"

          setEditing(true);                  value="bbcode"

          setTempText(currentText || "");                  checked={editMode === "bbcode"}

        }}                  onChange={() => {

        style={{ marginTop: "2rem", width: "100%" }}                    setEditMode("bbcode");

      >                    setTempBBCode(currentBBCode || "");

        Edit Profile Text                  }}

      </Button>                />{" "}

    </div>                BBCode

  );              </label>

};            </div>

            {editMode === "text" && (

export default ProfileTextEditor;              <textarea
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
              <div
                dangerouslySetInnerHTML={{ __html: parseBBCode(currentBBCode) }}
              />
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
