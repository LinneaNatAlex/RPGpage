import style from "./PotionList.module.css";

const potions = [
  {
    id: 1,
    name: "Love Potion",
    image: "/images/lovepotion.png",
    effect: "Induces strong feelings of love in the drinker.",
    ingredients: "Rose petals, unicorn hair, sugar, raspberries, magical water",
    howToMake:
      "Boil magical water, add rose petals and raspberries. Stir in sugar and unicorn hair, let it infuse under a full moon.",
    usage: "Drink to fall in love.",
    siteEffect:
      "(On the website: When you drink this, hearts will rain on your profile for 10 minutes, your profile turns pink, and it shows who you are in love with.)",
  },
  {
    id: 2,
    name: "Invisibility Potion",
    image: "/images/invisibilitypotion.png",
    effect: "Makes the user invisible to others for a limited time.",
    ingredients: "Hidden mushrooms, dragon blood, stardust, shadow leaf",
    howToMake:
      "Mix stardust and dragon blood, add shadow leaf and hidden mushrooms. Leave in darkness for 2 hours.",
    usage: "Drink to become invisible.",
    siteEffect:
      "(On the website: Your profile becomes invisible to others for 5 minutes, and you disappear from the online list.)",
  },
  {
    id: 3,
    name: "Energy Elixir",
    image: "/images/energyelixir.png",
    effect: "Gives the user extra energy and endurance.",
    ingredients: "Blackcurrant, phoenix feather, honey, magical herb",
    howToMake:
      "Crush blackcurrant and magical herb, mix with honey and phoenix feather. Shake well.",
    usage: "Drink to gain energy and strength.",
    siteEffect:
      "(On the website: You get a glowing aura around your avatar for 10 minutes and can send extra messages in the chat.)",
  },
  {
    id: 4,
    name: "Truth Serum",
    image: "/images/truthserum.png",
    effect: "Forces the user to speak the truth for a period of time.",
    ingredients: "Silver leaf, amber, troll berries, magical salt",
    howToMake:
      "Mix all ingredients in a silver cauldron, boil and let cool under starlight.",
    usage: "Drink to reveal the truth.",
    siteEffect:
      "(On the website: You can only send truthful messages for 5 minutes, and your chat bubble gets a blue glow.)",
  },
];

const PotionList = () => {
  return (
    <div className={style.potionList}>
      <ul className={style.potionItems}>
        <div className={style.gridElement}>
          {potions.map((potion) => (
            <li key={potion.id} className={style.potionItem}>
              <h3 className={style.potionName}>{potion.name}</h3>
              <div className={style.imageContainer}>
                <img
                  src={potion.image}
                  alt={potion.name}
                  className={style.potionImage}
                />
              </div>
              <p>
                <strong>Effect:</strong> {potion.effect}
              </p>
              <p>
                <strong>Ingredients:</strong> {potion.ingredients}
              </p>
              <p>
                <strong>Instructions:</strong> {potion.howToMake}
              </p>
              <p>
                <strong>Usage:</strong> {potion.usage}
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#b0aac2",
                }}
              >
                {potion.siteEffect}
              </p>
            </li>
          ))}
        </div>
      </ul>
    </div>
  );
};

export default PotionList;
