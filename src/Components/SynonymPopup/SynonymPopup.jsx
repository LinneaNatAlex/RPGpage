import React from "react";
import styles from "./SynonymPopup.module.css";

/**
 * Component that displays a popup with synonym suggestions
 * @param {Object} props
 * @param {string[]} props.synonyms - Array of synonym words
 * @param {boolean} props.loading - Whether synonyms are being fetched
 * @param {string|null} props.error - Error message if any
 * @param {Function} props.onSelect - Callback when a synonym is selected
 * @param {Object} props.position - Position object with {top, left} for popup placement
 * @param {boolean} props.visible - Whether the popup should be visible
 */
const SynonymPopup = ({
  synonyms,
  loading,
  error,
  onSelect,
  position,
  visible,
}) => {
  // Don't show if not visible
  if (!visible) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <div
        className={styles.synonymPopup}
        data-synonym-popup="true"
        style={{
          position: "absolute",
          top: position?.top || "auto",
          left: position?.left || "auto",
          zIndex: 10000,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div style={{ padding: "12px", color: "#d4c4a8", textAlign: "center" }}>
          Loading synonyms...
        </div>
      </div>
    );
  }

  // Show error message or "no results" instead of hiding completely
  if (error) {
    return (
      <div
        className={styles.synonymPopup}
        data-synonym-popup="true"
        style={{
          position: "absolute",
          top: position?.top || "auto",
          left: position?.left || "auto",
          zIndex: 10000,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div style={{ padding: "12px", color: "#ff6b6b", textAlign: "center" }}>
          Could not load synonyms
        </div>
      </div>
    );
  }

  // Show "no results" message if no synonyms found
  if (!synonyms || synonyms.length === 0) {
    return (
      <div
        className={styles.synonymPopup}
        data-synonym-popup="true"
        style={{
          position: "absolute",
          top: position?.top || "auto",
          left: position?.left || "auto",
          zIndex: 10000,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div style={{ padding: "12px", color: "#d4c4a8", textAlign: "center" }}>
          No synonyms found
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.synonymPopup}
      data-synonym-popup="true"
      style={{
        position: "absolute",
        top: position?.top || "auto",
        left: position?.left || "auto",
        zIndex: 10000,
      }}
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent text selection
        e.stopPropagation(); // Prevent event from bubbling to document
      }}
    >
      <ul className={styles.synonymList}>
        {synonyms.map((synonym, index) => (
          <li
            key={index}
            className={styles.synonymItem}
            onClick={() => onSelect?.(synonym)}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent blur event
              e.stopPropagation(); // Prevent event bubbling
            }}
          >
            {synonym}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SynonymPopup;
