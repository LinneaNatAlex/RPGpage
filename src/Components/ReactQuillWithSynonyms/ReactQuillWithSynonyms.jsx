import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useSynonym } from "../../hooks/useSynonym";
import SynonymPopup from "../SynonymPopup/SynonymPopup";

/**
 * ReactQuill wrapper component with synonym suggestion functionality
 * @param {Object} props - All ReactQuill props, plus:
 * @param {boolean} props.enableSynonyms - Whether to enable synonym suggestions (default: true)
 */
const ReactQuillWithSynonyms = ({
  enableSynonyms = true,
  value,
  onChange,
  id,
  name,
  ...quillProps
}) => {
  const quillRef = useRef(null);
  const editorRef = useRef(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const { synonyms, loading, error, fetchSynonyms } = useSynonym();
  const debounceTimerRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const shouldKeepPopupOpenRef = useRef(false); // Track if popup should stay open

  const POPUP_MAX_WIDTH = 300;

  // Keep popup inside editor bounds so it isn't cut off at the right edge
  const clampPopupPosition = useCallback((bounds) => {
    if (!editorRef.current || !bounds) return { top: "10px", left: "10px" };
    const qlEditor = editorRef.current.querySelector(".ql-editor");
    const containerWidth = qlEditor ? qlEditor.offsetWidth : editorRef.current.offsetWidth;
    let leftPx = bounds.left;
    if (leftPx + POPUP_MAX_WIDTH > containerWidth) {
      leftPx = Math.max(0, containerWidth - POPUP_MAX_WIDTH);
    }
    if (leftPx < 0) leftPx = 0;
    return {
      top: `${bounds.top + bounds.height + 5}px`,
      left: `${leftPx}px`,
    };
  }, []);

  // Get the current selected word from Quill editor
  const getSelectedWord = useCallback(() => {
    if (!quillInstanceRef.current) return null;

    try {
      const quill = quillInstanceRef.current;
      const selection = quill.getSelection();

      if (!selection) return null;

      const text = quill.getText();
      const start = Math.max(0, selection.index - 50);
      const end = Math.min(text.length, selection.index + selection.length + 50);
      const context = text.slice(start, end);
      const relativeIndex = selection.index - start;

      // Find the word at cursor position (include apostrophes for contractions)
      const beforeCursor = context.slice(0, relativeIndex);
      const afterCursor = context.slice(relativeIndex);

      // Match word characters AND apostrophes (for contractions like "can't", "won't")
      const beforeMatch = beforeCursor.match(/([\w']+)$/);
      const afterMatch = afterCursor.match(/^([\w']+)/);

      if (!beforeMatch && !afterMatch) return null;

      const word = (beforeMatch ? beforeMatch[1] : "") + (afterMatch ? afterMatch[1] : "");

      if (word.length < 2) return null;

      return {
        word: word.toLowerCase(),
        startIndex: selection.index - (beforeMatch ? beforeMatch[1].length : 0),
        length: word.length,
      };
    } catch (error) {
      return null;
    }
  }, []);

  // Store Quill instance when it's ready
  useEffect(() => {
    if (quillRef.current && !quillInstanceRef.current) {
      // ReactQuill exposes the editor via the ref
      const editor = quillRef.current?.editor || quillRef.current?.getEditor?.();
      if (editor) {
        quillInstanceRef.current = editor;
      }
    }
  }, [value]); // Re-check when value changes

  // Set id/name and aria-label on the actual contenteditable (.ql-editor) so browser form-field checks pass
  useEffect(() => {
    if (!id || !name || !editorRef.current) return;
    const applyToEditor = () => {
      if (!editorRef.current) return;
      const qlEditor = editorRef.current.querySelector(".ql-editor");
      if (qlEditor) {
        qlEditor.setAttribute("id", `${id}-editor`);
        qlEditor.setAttribute("name", name);
        qlEditor.setAttribute("aria-label", name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim());
      }
    };
    const t = setTimeout(applyToEditor, 0);
    return () => clearTimeout(t);
  }, [id, name, value]);

  // Quill toolbar contains inputs (e.g. link URL); give them id/name to satisfy form-field checks
  useEffect(() => {
    if (!id || !editorRef.current) return;
    const applyToToolbar = () => {
      if (!editorRef.current) return;
      const inputs = editorRef.current.querySelectorAll(".ql-toolbar input, .ql-toolbar select, .ql-toolbar textarea");
      inputs.forEach((el, i) => {
        if (!el.id) el.setAttribute("id", `${id}-toolbar-${i}`);
        if (!el.getAttribute("name")) el.setAttribute("name", `${id}-toolbar-${i}`);
      });
    };
    const t = setTimeout(applyToToolbar, 100);
    return () => clearTimeout(t);
  }, [id, value]);

  // Handle text changes and selection changes
  useEffect(() => {
    if (!enableSynonyms || !quillInstanceRef.current) return;

    const quill = quillInstanceRef.current;

    const handleSelectionChange = () => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce to avoid too many API calls
      debounceTimerRef.current = setTimeout(() => {
        const wordInfo = getSelectedWord();

        if (wordInfo) {
          // Only update if it's a different word (avoid closing while loading)
          const isNewWord = !selectedWord || selectedWord.word !== wordInfo.word;
          
          if (isNewWord) {
            setSelectedWord(wordInfo);
            
            // Calculate popup position (clamped so it stays inside editor)
            try {
              const selection = quill.getSelection();
              if (selection && editorRef.current) {
                const bounds = quill.getBounds(selection.index);
                setPopupPosition(clampPopupPosition(bounds));
              }
            } catch (error) {
              setPopupPosition({ top: "50px", left: "10px" });
            }
            
            // Mark that popup should stay open FOREVER until user clicks outside
            shouldKeepPopupOpenRef.current = true;
            // Fetch synonyms and show popup
            fetchSynonyms(wordInfo.word);
            // Always show popup when word is selected
            setShowPopup(true);
          } else {
            // Same word - just update position if needed
            try {
              const selection = quill.getSelection();
              if (selection && editorRef.current) {
                const bounds = quill.getBounds(selection.index);
                setPopupPosition(clampPopupPosition(bounds));
              }
            } catch (error) {
              // Ignore position update errors
            }
            // Keep popup open if it's the same word - NEVER close it automatically
            shouldKeepPopupOpenRef.current = true;
            setShowPopup(true);
          }
        }
        // NEVER auto-close popup - only close on manual user action (click outside or synonym select)
        // If wordInfo is null, we DON'T close - user might have clicked elsewhere but popup should stay
      }, 300);
    };

    const handleTextChange = () => {
      // Update popup position on text change, but don't close popup
      if (selectedWord && showPopup) {
        // Only update position, don't trigger selection change which might close popup
        try {
          const selection = quill.getSelection();
          if (selection && editorRef.current) {
            const bounds = quill.getBounds(selection.index);
            setPopupPosition(clampPopupPosition(bounds));
          }
        } catch (error) {
          // Ignore position update errors
        }
      }
    };

    quill.on("selection-change", handleSelectionChange);
    quill.on("text-change", handleTextChange);

    return () => {
      quill.off("selection-change", handleSelectionChange);
      quill.off("text-change", handleTextChange);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [enableSynonyms, getSelectedWord, fetchSynonyms, selectedWord, clampPopupPosition]);

  // Don't reset shouldKeepPopupOpenRef - let it stay true so popup never auto-closes

  // Handle synonym selection
  const handleSynonymSelect = useCallback(
    (synonym) => {
      if (!selectedWord || !quillInstanceRef.current) return;

      try {
        const quill = quillInstanceRef.current;

        // Replace the word with the selected synonym
        quill.deleteText(selectedWord.startIndex, selectedWord.length, "user");
        quill.insertText(selectedWord.startIndex, synonym, "user");
        quill.setSelection(selectedWord.startIndex + synonym.length, "silent");

        // Trigger onChange manually since we're using "user" source
        if (onChange) {
          onChange(quill.root.innerHTML);
        }

        // Close popup
        shouldKeepPopupOpenRef.current = false;
        setShowPopup(false);
        setSelectedWord(null);
      } catch (error) {
        // Silently fail - feature shouldn't break the editor
      }
    },
    [selectedWord, onChange]
  );

  // Close popup when clicking outside
  useEffect(() => {
    if (!showPopup || !selectedWord) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      
      // Check if click is on popup
      const isClickInPopup = target.closest('[data-synonym-popup]') ||
                             target.closest('.synonymPopup');

      // Check if click is in editor (but allow closing if clicking elsewhere in editor)
      const isClickInEditor = editorRef.current?.contains(target);
      
      // Close if click is outside popup (even if inside editor, as long as not on popup)
      // But if click is directly on popup, keep it open
      if (!isClickInPopup) {
        // Click is outside popup - close it
        shouldKeepPopupOpenRef.current = false;
        setShowPopup(false);
        setSelectedWord(null);
      }
      // If click is on popup, keep it open
    };

    // Register listener with a small delay to let popup render first
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [showPopup, selectedWord]);

  return (
    <div
      ref={editorRef}
      id={id}
      data-name={name}
      role="application"
      aria-label={name ? undefined : "Rich text editor"}
      style={{ position: "relative" }}
    >
      <ReactQuill
        ref={(el) => {
          quillRef.current = el;
          if (el?.editor) {
            quillInstanceRef.current = el.editor;
          } else if (el?.getEditor) {
            quillInstanceRef.current = el.getEditor();
          }
        }}
        value={value}
        onChange={onChange}
        {...quillProps}
      />
      {enableSynonyms && showPopup && selectedWord && (
        <SynonymPopup
          synonyms={synonyms}
          loading={loading}
          error={error}
          onSelect={handleSynonymSelect}
          position={popupPosition}
          visible={true}
        />
      )}
    </div>
  );
};

export default ReactQuillWithSynonyms;

