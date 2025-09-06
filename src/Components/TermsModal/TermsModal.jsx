import React from "react";
import styles from "./TermsModal.module.css";

const TermsModal = ({ onClose }) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent}>
      <h2>Terms and Conditions</h2>
      <div className={styles.termsText}>
        <p>By registering and using this site, you agree to the following:</p>
        <ul>
          <li>You are at least 13 years old or have parental consent.</li>
          <li>You will treat all members with respect and kindness.</li>
          <li>No bullying, harassment, or hate speech is tolerated.</li>
          <li>All roleplay must remain appropriate for a general audience.</li>
          <li>Do not share personal information or passwords with others.</li>
          <li>Content you post must be your own or used with permission.</li>
          <li>Admins may remove content or users that violate these rules.</li>
          <li>Breaking the rules may result in a ban or account removal.</li>
        </ul>
        <p>
          For questions, contact the site admin. By checking the box, you accept
          these terms.
        </p>
      </div>
      <button className={styles.closeBtn} onClick={onClose}>
        Close
      </button>
    </div>
  </div>
);

export default TermsModal;
