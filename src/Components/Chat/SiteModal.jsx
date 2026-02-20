import styles from "./Chat.module.css";

/**
 * Site-themed modal for alerts and confirmations (replaces browser alert/confirm).
 * - variant "alert": message + OK
 * - variant "confirm": message + OK + Cancel
 */
export default function SiteModal({
  open,
  message,
  variant = "alert",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div
      className={styles.siteModalOverlay}
      onClick={variant === "confirm" ? onCancel : onConfirm}
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-modal-message"
    >
      <div
        className={styles.siteModal}
        onClick={(e) => e.stopPropagation()}
      >
        <p id="site-modal-message" className={styles.siteModalMessage}>
          {message}
        </p>
        <div className={styles.siteModalActions}>
          {variant === "confirm" && (
            <button
              type="button"
              className={`${styles.siteModalBtn} ${styles.siteModalBtnSecondary}`}
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className={styles.siteModalBtn}
            onClick={onConfirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
