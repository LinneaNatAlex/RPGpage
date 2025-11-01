import React from "react";
import styles from "./RepetitionWarning.module.css";

/**
 * Component that displays warnings about repetitive text
 * @param {Object} props
 * @param {Array} props.warnings - Array of warning objects from useRepetitionCheck
 * @param {boolean} props.visible - Whether the warning should be visible
 */
const RepetitionWarning = ({ warnings, visible }) => {
  if (!visible || !warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div className={styles.repetitionWarning}>
      <div className={styles.warningHeader}>
        <span className={styles.warningTitle}>Repetition Detected</span>
      </div>
      <div className={styles.warningContent}>
        {warnings.slice(0, 3).map((warning, index) => (
          <div key={index} className={styles.warningItem}>
            <span className={styles.warningMessage}>{warning.message}</span>
          </div>
        ))}
        {warnings.length > 3 && (
          <div className={styles.warningItem}>
            <span className={styles.warningMessage}>
              +{warnings.length - 3} more repetition{warnings.length - 3 > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepetitionWarning;

