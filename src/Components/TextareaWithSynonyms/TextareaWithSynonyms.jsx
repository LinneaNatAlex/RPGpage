import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSynonym } from "../../hooks/useSynonym";
import SynonymPopup from "../SynonymPopup/SynonymPopup";

/**
 * Textarea component with synonym suggestion functionality
 * @param {Object} props - All standard textarea props, plus:
 * @param {boolean} props.enableSynonyms - Whether to enable synonym suggestions (default: true)
 */
const TextareaWithSynonyms = ({
  enableSynonyms = true,
  value,
  onChange,
  ...textareaProps
}) => {
  const textareaRef = useRef(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const { synonyms, loading, error, fetchSynonyms } = useSynonym();
  const debounceTimerRef = useRef(null);
  const shouldKeepPopupOpenRef = useRef(false); // Track if popup should stay open

  // Get the word at cursor position
  const getSelectedWord = useCallback(() => {
    if (!textareaRef.current) return null;

    try {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // If text is selected, get that word
      if (start !== end) {
        const selectedText = value.slice(start, end).trim();
        if (selectedText.length >= 2 && !selectedText.includes(" ")) {
          return {
            word: selectedText.toLowerCase(),
            startIndex: start,
            length: selectedText.length,
          };
        }
      }

      // Otherwise, get word at cursor (include apostrophes for contractions)
      const text = value;
      const beforeCursor = text.slice(0, start);
      const afterCursor = text.slice(start);

      // Match word characters AND apostrophes (for contractions like "can't", "won't")
      const beforeMatch = beforeCursor.match(/([\w']+)$/);
      const afterMatch = afterCursor.match(/^([\w']+)/);

      if (!beforeMatch && !afterMatch) return null;

      const word =
        (beforeMatch ? beforeMatch[1] : "") + (afterMatch ? afterMatch[1] : "");

      if (word.length < 2) return null;

      const wordStart = start - (beforeMatch ? beforeMatch[1].length : 0);

      return {
        word: word.toLowerCase(),
        startIndex: wordStart,
        length: word.length,
      };
    } catch (error) {
      return null;
    }
  }, [value]);

  // Handle selection change
  const handleSelectionChange = useCallback(() => {
    if (!enableSynonyms) return;

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
          // Mark that popup should stay open
          shouldKeepPopupOpenRef.current = true;
          fetchSynonyms(wordInfo.word);

          // Calculate popup position
          if (textareaRef.current) {
            const textarea = textareaRef.current;
            const textareaRect = textarea.getBoundingClientRect();
            const start = textarea.selectionStart;

            // Create a temporary span to measure text position
            const span = document.createElement("span");
            span.style.visibility = "hidden";
            span.style.position = "absolute";
            span.style.whiteSpace = "pre-wrap";
            span.style.font = window.getComputedStyle(textarea).font;
            span.style.padding = window.getComputedStyle(textarea).padding;
            span.textContent = value.slice(0, start);
            document.body.appendChild(span);

            const spanRect = span.getBoundingClientRect();
            document.body.removeChild(span);

            // Calculate position relative to textarea
            const x = spanRect.left - textareaRect.left + textarea.scrollLeft;
            const y =
              spanRect.top -
              textareaRect.top +
              textarea.scrollTop +
              spanRect.height +
              5;

            setPopupPosition({
              top: y + "px",
              left: x + "px",
            });
          }
          // Always show popup when word is selected
          setShowPopup(true);
        } else {
          // Same word - keep popup open - don't close it
          setShowPopup(true);
        }
      }
      // Don't auto-close popup - only close on manual user action (click outside or synonym select)
    }, 500); // 500ms debounce
  }, [
    enableSynonyms,
    getSelectedWord,
    fetchSynonyms,
    value,
    selectedWord,
    loading,
  ]);

  // Handle synonym selection
  const handleSynonymSelect = useCallback(
    (synonym) => {
      if (!selectedWord || !textareaRef.current) return;

      try {
        const textarea = textareaRef.current;
        const newValue =
          value.slice(0, selectedWord.startIndex) +
          synonym +
          value.slice(selectedWord.startIndex + selectedWord.length);

        // Update value
        onChange?.({ target: { value: newValue } });

        // Set cursor position after the replaced word
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = selectedWord.startIndex + synonym.length;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);

        // Close popup
        shouldKeepPopupOpenRef.current = false;
        setShowPopup(false);
        setSelectedWord(null);
      } catch (error) {
        console.error("Error replacing word with synonym:", error);
      }
    },
    [selectedWord, value, onChange]
  );

  // Close popup when clicking outside
  useEffect(() => {
    if (!showPopup || !selectedWord) return;

    const handleClickOutside = (event) => {
      const target = event.target;

      // Check if click is on popup
      const isClickInPopup =
        target.closest("[data-synonym-popup]") ||
        target.closest(".synonymPopup");

      // Check if click is in textarea
      const isClickInTextarea = textareaRef.current?.contains(target);

      // Only close if click is outside BOTH popup and textarea
      if (!isClickInPopup && !isClickInTextarea) {
        // Click is outside both - close it
        shouldKeepPopupOpenRef.current = false;
        setShowPopup(false);
        setSelectedWord(null);
      }
    };

    // Register listener with a delay to let popup render first
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 200); // Increased delay to prevent premature closing

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside, true);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [showPopup, selectedWord]);

  // Handle mouse up and key up events for text selection
  useEffect(() => {
    if (!enableSynonyms || !textareaRef.current) return;

    const textarea = textareaRef.current;

    // Only trigger on mouseup (when user finishes selecting text)
    const handleMouseUp = () => {
      handleSelectionChange();
    };

    textarea.addEventListener("mouseup", handleMouseUp);

    return () => {
      textarea.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enableSynonyms, handleSelectionChange]);

  return (
    <div style={{ position: "relative" }}>
      <textarea
        id={textareaProps.id ?? "textarea-with-synonyms"}
        name={textareaProps.name ?? "textareaContent"}
        ref={textareaRef}
        value={value}
        onChange={onChange}
        {...textareaProps}
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

export default TextareaWithSynonyms;
