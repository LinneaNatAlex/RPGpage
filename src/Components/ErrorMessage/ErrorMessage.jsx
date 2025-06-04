import styles from "./ErrorMessage.module.css";
// Error message component to display error messages in the application
const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return <div className={styles.error}>{message}</div>;
};

export default ErrorMessage;
