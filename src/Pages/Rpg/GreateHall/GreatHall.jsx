// imports the necessary modules and components.
import styles from "./GreatHall.module.css";
import LiveRP from "../../../Components/LiveRP/LiveRP.jsx";
// Imports Live chat component for role-playing in the Starshade Hall
const GreatHall = () => {
  return (
    <div className={styles.GreatHallClass}>
      <h1 className={styles.title}>Starshade Hall</h1>
      <LiveRP />
    </div>
  );
};

export default GreatHall;
