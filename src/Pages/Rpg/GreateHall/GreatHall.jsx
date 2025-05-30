import styles from "./GreatHall.module.css";
import LiveRP from "../../../Components/LiveRP/LiveRP";
const GreatHall = () => {
  return (
    <div className={styles.GreatHallClass}>
      <h1>Great Hall</h1>
      <LiveRP />
    </div>
  );
};

export default GreatHall;
