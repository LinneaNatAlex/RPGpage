import { Link } from "react-router-dom";
import PrivateChat from "../Components/Chat/PrivateChat";
import styles from "./MessagesPage.module.css";

export default function MessagesPage() {
  return (
    <div className={styles.wrapper}>
      <PrivateChat fullPage />
    </div>
  );
}
