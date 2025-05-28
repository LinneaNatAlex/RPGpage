import { useState, useEffect } from "react";
import style from "./PotionList.module.css"; // Assuming you have a CSS module for styling
const PotionList = () => {
  const [potions, setPotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.potterdb.com/v1/potions")
      .then((res) => res.json())
      .then((data) => {
        setPotions(data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Loading potions...</div>;
  }

  return (
    <div className={style.potionList}>
      <ul className={style.potionItems}>
        <div className={style.gridElement}>
          {potions.map((potion) => (
            <li key={potion.id}>
              <h3>{potion.attributes.name}</h3>
              <img
                src={potion.attributes.image}
                alt={potion.attributes.name}
                className={style.potionImage}
              />
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
