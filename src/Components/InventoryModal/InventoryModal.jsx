import React from "react";
import styles from "./InventoryModal.module.css";

const InventoryModal = ({ open, onClose, inventory }) => {
  if (!open) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Inventory</h2>
        {Array.isArray(inventory) && inventory.length > 0 ? (
          <ul className={styles.inventoryList}>
            {inventory.map((item, idx) => (
              <li key={idx} className={styles.inventoryItem}>
                <img
                  src="/icons/chest.svg"
                  alt="item"
                  style={{
                    width: 28,
                    height: 28,
                    marginRight: 8,
                    filter: "drop-shadow(0 0 2px #a084e8)",
                  }}
                />
                {item.name} x{item.qty || 1}
              </li>
            ))}
          </ul>
        ) : (
          <span className={styles.emptyText}>Empty</span>
        )}
        <button className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default InventoryModal;
