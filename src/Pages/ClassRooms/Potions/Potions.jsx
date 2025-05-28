import styles from "./Potions.module.css";
import PotionList from "../../../Components/PotionList/PotionList";

const Potions = () => {
  return (
    <div className={styles.PotionsClass}>
      <h1>Potions</h1>
      <PotionList />
    </div>
  );
};

export default Potions;
