// imports the nessessary modules and components.
import styles from "./Potions.module.css";
import PotionList from "../../../Components/PotionList/PotionList";
// Fetching the potion list component.
const Potions = () => {
  return (
    <div className={styles.PotionsClass}>
      <h1 className={styles.title}>Potions</h1>
      <PotionList />
    </div>
  );
};

export default Potions;
