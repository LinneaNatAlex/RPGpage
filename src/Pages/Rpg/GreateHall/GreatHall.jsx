// imports the necessary modules and components.
import styles from "./GreatHall.module.css";
import LiveRP from "../../../Components/LiveRP/LiveRP";
// Imports Live chat component for role-playing in the Great Hall
const GreatHall = () => {
  return (
    <div className={styles.GreatHallClass}>
      <h1 className={styles.title}>Great Hall</h1>
      <LiveRP />
    </div>
  );
};

export default GreatHall;
