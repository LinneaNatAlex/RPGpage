import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/authContext';
import styles from './PotionCrafting.module.css';

// Potion recipes with required ingredients
const POTION_RECIPES = {
  'Healing Potion': {
    ingredients: [
      { name: 'Rose Petals', amount: 3 },
      { name: 'Moonstone Dust', amount: 1 },
      { name: 'Dragon Blood', amount: 1 },
      { name: 'Phoenix Feather', amount: 1 },
      { name: 'Unicorn Hair', amount: 1 }
    ],
    result: {
      name: 'Healing Potion',
      type: 'potion',
      price: 50,
      description: 'Restores health when consumed.'
    }
  },
  'Mana Potion': {
    ingredients: [
      { name: 'Moonstone Dust', amount: 2 },
      { name: 'Dragon Blood', amount: 1 },
      { name: 'Phoenix Feather', amount: 2 },
      { name: 'Unicorn Hair', amount: 1 },
      { name: 'Rose Petals', amount: 1 }
    ],
    result: {
      name: 'Mana Potion',
      type: 'potion',
      price: 60,
      description: 'Restores magical energy when consumed.'
    }
  },
  'Stamina Potion': {
    ingredients: [
      { name: 'Phoenix Feather', amount: 3 },
      { name: 'Dragon Blood', amount: 2 },
      { name: 'Unicorn Hair', amount: 1 },
      { name: 'Rose Petals', amount: 2 },
      { name: 'Moonstone Dust', amount: 1 }
    ],
    result: {
      name: 'Stamina Potion',
      type: 'potion',
      price: 40,
      description: 'Restores physical energy when consumed.'
    }
  }
};

const PotionCrafting = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [userIngredients, setUserIngredients] = useState({});
  const [hasCauldron, setHasCauldron] = useState(false);
  const [craftingResult, setCraftingResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        
        // Check if user has cauldron
        const inventory = data.inventory || [];
        const cauldron = inventory.find(item => 
          item.name === 'Cauldron' || item.name === 'Silver Cauldron'
        );
        setHasCauldron(!!cauldron);
        
        // Count ingredients
        const ingredients = {};
        inventory.forEach(item => {
          if (item.type === 'ingredient') {
            ingredients[item.name] = (ingredients[item.name] || 0) + (item.qty || 1);
          }
        });
        setUserIngredients(ingredients);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCraftPotion = (recipe) => {
    if (!hasCauldron) return false;
    
    return recipe.ingredients.every(ingredient => {
      const userAmount = userIngredients[ingredient.name] || 0;
      return userAmount >= ingredient.amount;
    });
  };

  const craftPotion = async (recipe) => {
    if (!canCraftPotion(recipe)) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const data = userDoc.data();
      const inventory = [...(data.inventory || [])];
      
      // Remove ingredients
      recipe.ingredients.forEach(ingredient => {
        const itemIndex = inventory.findIndex(item => 
          item.name === ingredient.name && item.type === 'ingredient'
        );
        if (itemIndex >= 0) {
          inventory[itemIndex].qty -= ingredient.amount;
          if (inventory[itemIndex].qty <= 0) {
            inventory.splice(itemIndex, 1);
          }
        }
      });
      
      // Add crafted potion
      const existingPotion = inventory.find(item => item.name === recipe.result.name);
      if (existingPotion) {
        existingPotion.qty = (existingPotion.qty || 1) + 1;
      } else {
        inventory.push({
          ...recipe.result,
          qty: 1,
          crafted: true,
          craftedAt: Date.now()
        });
      }
      
      await updateDoc(userRef, { inventory });
      
      setCraftingResult(recipe.result.name);
      await loadUserData(); // Reload data
      
      setTimeout(() => setCraftingResult(null), 3000);
    } catch (error) {
      console.error('Error crafting potion:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!hasCauldron) {
    return (
      <div className={styles.noCauldron}>
        <h3>Potion Crafting</h3>
        <p>You need a cauldron to craft potions!</p>
        <p>Visit the shop to purchase a cauldron first.</p>
      </div>
    );
  }

  return (
    <div className={styles.potionCrafting}>
      <h3>Potion Crafting</h3>
      
      {craftingResult && (
        <div className={styles.successMessage}>
          Successfully crafted {craftingResult}!
        </div>
      )}
      
      <div className={styles.ingredients}>
        <h4>Your Ingredients:</h4>
        <div className={styles.ingredientList}>
          {Object.entries(userIngredients).map(([name, amount]) => (
            <div key={name} className={styles.ingredientItem}>
              <span className={styles.ingredientName}>{name}</span>
              <span className={styles.ingredientAmount}>{amount}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.recipes}>
        <h4>Available Recipes:</h4>
        {Object.entries(POTION_RECIPES).map(([name, recipe]) => (
          <div key={name} className={styles.recipe}>
            <h5>{name}</h5>
            <div className={styles.recipeIngredients}>
              <p>Required ingredients:</p>
              <ul>
                {recipe.ingredients.map((ingredient, index) => {
                  const userAmount = userIngredients[ingredient.name] || 0;
                  const hasEnough = userAmount >= ingredient.amount;
                  return (
                    <li key={index} className={hasEnough ? styles.available : styles.missing}>
                      {ingredient.name}: {userAmount}/{ingredient.amount}
                    </li>
                  );
                })}
              </ul>
            </div>
            <button
              className={`${styles.craftButton} ${canCraftPotion(recipe) ? styles.canCraft : styles.cannotCraft}`}
              onClick={() => craftPotion(recipe)}
              disabled={!canCraftPotion(recipe)}
            >
              {canCraftPotion(recipe) ? 'Craft Potion' : 'Missing Ingredients'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PotionCrafting;
