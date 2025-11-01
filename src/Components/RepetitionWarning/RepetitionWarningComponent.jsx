import React, { useEffect, useState } from "react";
import { useRepetitionCheck } from "../../hooks/useRepetitionCheck";
import RepetitionWarning from "./RepetitionWarning";

/**
 * Component that checks text for repetition and displays warnings
 * @param {Object} props
 * @param {string} props.text - The text to analyze
 * @param {boolean} props.enabled - Whether repetition checking is enabled (default: true)
 */
const RepetitionWarningComponent = ({ text, enabled = true }) => {
  const { checkRepetition, warnings } = useRepetitionCheck();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!enabled || !text || text.trim().length < 50) {
      setShowWarning(false);
      return;
    }

    // Debounce the check
    const timer = setTimeout(() => {
      const foundWarnings = checkRepetition(text, {
        wordThreshold: 4, // Word must appear 4+ times
        phraseLength: 2, // Check 2-word phrases
        minWordLength: 3, // Only check words 3+ characters
      });
      setShowWarning(foundWarnings.length > 0);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [text, enabled, checkRepetition]);

  return <RepetitionWarning warnings={warnings} visible={showWarning} />;
};

export default RepetitionWarningComponent;

