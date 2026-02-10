import React, { useState } from "react";

const potions = [
  {
    id: 1,
    name: "Love Potion",
    ingredients: [
      "Rose petals",
      "unicorn hair",
      "sugar",
      "raspberries",
      "magical water",
    ],
    order: [
      "magical water",
      "rose petals",
      "raspberries",
      "sugar",
      "unicorn hair",
    ],
  },
  {
    id: 2,
    name: "Invisibility Potion",
    ingredients: [
      "Hidden mushrooms",
      "dragon blood",
      "stardust",
      "shadow leaf",
    ],
    order: ["stardust", "dragon blood", "shadow leaf", "Hidden mushrooms"],
  },
  {
    id: 3,
    name: "Energy Elixir",
    ingredients: ["Blackcurrant", "phoenix feather", "honey", "magical herb"],
    order: ["blackcurrant", "magical herb", "honey", "phoenix feather"],
  },
  {
    id: 4,
    name: "Truth Serum",
    ingredients: ["Silver leaf", "amber", "troll berries", "magical salt"],
    order: ["silver leaf", "amber", "troll berries", "magical salt"],
  },
];

export default function Potions() {
  const [selectedPotion, setSelectedPotion] = useState(null);
  const [step, setStep] = useState(0);
  const [added, setAdded] = useState([]);
  const [result, setResult] = useState(null);
  const [brewing, setBrewing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  function startPotion(potion) {
    setSelectedPotion(potion);
    setStep(0);
    setAdded([]);
    setResult(null);
    setBrewing(false);
    setCountdown(0);
  }

  function addIngredient(ingredient) {
    if (!selectedPotion) return;
    const expected = selectedPotion.order[step].toLowerCase();
    if (ingredient.toLowerCase() !== expected) {
      setResult("Failed! Wrong ingredient order. You lost your ingredients.");
      setAdded([]);
      setStep(0);
      setBrewing(false);
      setCountdown(0);
      return;
    }
    setAdded([...added, ingredient]);
    setStep(step + 1);
    if (step + 1 === selectedPotion.order.length) {
      // Start brewing
      setBrewing(true);
      setCountdown(5 + Math.floor(Math.random() * 6)); // 5-10 seconds
      setTimeout(() => {
        // 30% chance to fail
        if (Math.random() < 0.3) {
          setResult("Brewing failed! Try again. Ingredients lost.");
        } else {
          setResult("Success! Potion brewed.");
        }
        setBrewing(false);
        setAdded([]);
        setStep(0);
      }, 5000);
    }
  }

  return (
    <div
      style={{
        background: "#232340",
        borderRadius: 0,
        padding: 16,
        margin: "24px auto",
        maxWidth: 600,
      }}
    >
      <h2>🧪 Potions Class: Brew Your Own Potion</h2>
      {!selectedPotion && (
        <div>
          <b>Select a potion to brew:</b>
          <ul>
            {potions.map((p) => (
              <li key={p.id}>
                <button onClick={() => startPotion(p)}>{p.name}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedPotion && !brewing && !result && (
        <div>
          <b>Brewing: {selectedPotion.name}</b>
          <p>
            Step {step + 1} of {selectedPotion.order.length}: Add ingredient
          </p>
          <ul>
            {selectedPotion.ingredients.map((ing) => (
              <li key={ing}>
                <button
                  disabled={added.includes(ing)}
                  onClick={() => addIngredient(ing)}
                >
                  {ing} {added.includes(ing) ? "(added)" : ""}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {brewing && <div>Brewing... Please wait ({countdown}s)</div>}
      {result && (
        <div>
          <b>{result}</b>{" "}
          <button onClick={() => startPotion(selectedPotion)}>Try again</button>{" "}
          <button onClick={() => setSelectedPotion(null)}>Back</button>
        </div>
      )}
    </div>
  );
}
