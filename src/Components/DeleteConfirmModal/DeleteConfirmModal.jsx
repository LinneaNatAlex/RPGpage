import React from "react";
import Button from "../Button/Button";
import styles from "./DeleteConfirmModal.module.css";

const DeleteConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  itemName = "this item",
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Confirm Deletion</h3>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.warningIcon}>⚠️</div>
          <p>
            Are you sure you want to delete <strong>{itemName}</strong>?
          </p>
          <p className={styles.warningText}>This action cannot be undone.</p>
        </div>

        <div className={styles.modalFooter}>
          <Button onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className={styles.deleteButton}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
