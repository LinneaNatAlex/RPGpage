import { useState, useEffect } from "react";
import style from "./PotionList.module.css"; // Assuming you have a CSS module for styling
const PotionList = () => {
  const [potions, setPotions] = useState([]);
  const [loading, setLoading] = useState(true);
  //  fetch the portions from the API
  useEffect(() => {
    fetch("https://api.potterdb.com/v1/potions")
      .then((res) => res.json())
      .then((data) => {
        setPotions(data.data);
        setLoading(false);
      })
      // If there is an error fetching the data,
      .catch((error) => {
        setLoading(false);
      });
  }, []);
  // Loding while fetching the data
  if (loading) {
    return <div className="loading">Loading potions...</div>;
  }
  // -----------------------------POTION LIST CONTENT--------------------------------
  return (
    <div className={style.potionList}>
      <ul className={style.potionItems}>
        <div className={style.gridElement}>
          {potions.map((potion) => (
            <li key={potion.id} className={style.potionItem}>
              <h3 className={style.potionName}>{potion.attributes.name}</h3>
              <div className={style.imageContainer}>
                <img
                  src={potion.attributes.image}
                  alt={potion.attributes.name}
                  className={style.potionImage}
                />
              </div>
              <p>
                <br />
                <strong>Effect:</strong> {potion.attributes.effect}
              </p>
              <p>
                <strong>Ingredients:</strong> {potion.attributes.ingredients}
              </p>
              <p>
                <strong>Difficulty:</strong> {potion.attributes.difficulty}
              </p>
            </li>
          ))}
        </div>
      </ul>
    </div>
  );
};

export default PotionList;
