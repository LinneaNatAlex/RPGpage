import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/authContext';
import styles from './PotionCrafting.module.css';

// Potion recipes organized by year level
const POTION_RECIPES_BY_YEAR = {
  1: {
    'Slow Motion Potion': {
      ingredients: [
        { name: 'Rose Petals', amount: 2 },
        { name: 'Moonstone Dust', amount: 1 },
        { name: 'Dragon Blood', amount: 1 },
        { name: 'Phoenix Feather', amount: 1 },
        { name: 'Unicorn Hair', amount: 1 }
      ],
      result: {
        name: 'Slow Motion Potion',
        type: 'potion',
        price: 30,
        description: 'Makes everything appear to move in slow motion.',
        effect: 'slowMotion',
        duration: 300000 // 5 minutes
      }
    },
    'Shout Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 2 },
        { name: 'Dragon Blood', amount: 1 },
        { name: 'Phoenix Feather', amount: 2 },
        { name: 'Unicorn Hair', amount: 1 },
        { name: 'Rose Petals', amount: 1 }
      ],
      result: {
        name: 'Shout Potion',
        type: 'potion',
        price: 25,
        description: 'Makes your voice much louder.',
        effect: 'shout',
        duration: 600000 // 10 minutes
      }
    },
    'Echo Potion': {
      ingredients: [
        { name: 'Phoenix Feather', amount: 2 },
        { name: 'Dragon Blood', amount: 1 },
        { name: 'Unicorn Hair', amount: 2 },
        { name: 'Rose Petals', amount: 1 },
        { name: 'Moonstone Dust', amount: 1 }
      ],
      result: {
        name: 'Echo Potion',
        type: 'potion',
        price: 35,
        description: 'Creates echo effects with your voice.',
        effect: 'echo',
        duration: 900000 // 15 minutes
      }
    }
  },
  2: {
    'Translation Potion': {
      ingredients: [
        { name: 'Rose Petals', amount: 3 },
        { name: 'Moonstone Dust', amount: 2 },
        { name: 'Dragon Blood', amount: 1 },
        { name: 'Phoenix Feather', amount: 1 },
        { name: 'Unicorn Hair', amount: 2 }
      ],
      result: {
        name: 'Translation Potion',
        type: 'potion',
        price: 50,
        description: 'Translates text to different languages.',
        effect: 'translation',
        duration: 1800000 // 30 minutes
      }
    },
    'Speed Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 3 },
        { name: 'Dragon Blood', amount: 2 },
        { name: 'Phoenix Feather', amount: 1 },
        { name: 'Unicorn Hair', amount: 1 },
        { name: 'Rose Petals', amount: 2 }
      ],
      result: {
        name: 'Speed Potion',
        type: 'potion',
        price: 45,
        description: 'Makes you move faster.',
        effect: 'speed',
        duration: 1200000 // 20 minutes
      }
    },
    'Mirror Potion': {
      ingredients: [
        { name: 'Phoenix Feather', amount: 3 },
        { name: 'Dragon Blood', amount: 1 },
        { name: 'Unicorn Hair', amount: 3 },
        { name: 'Rose Petals', amount: 1 },
        { name: 'Moonstone Dust', amount: 2 }
      ],
      result: {
        name: 'Mirror Potion',
        type: 'potion',
        price: 40,
        description: 'Creates mirror effects.',
        effect: 'mirror',
        duration: 1500000 // 25 minutes
      }
    }
  },
  3: {
    'Sparkle Potion': {
      ingredients: [
        { name: 'Rose Petals', amount: 4 },
        { name: 'Moonstone Dust', amount: 3 },
        { name: 'Dragon Blood', amount: 2 },
        { name: 'Phoenix Feather', amount: 2 },
        { name: 'Unicorn Hair', amount: 1 }
      ],
      result: {
        name: 'Sparkle Potion',
        type: 'potion',
        price: 60,
        description: 'Makes everything sparkle.',
        effect: 'sparkle',
        duration: 2400000 // 40 minutes
      }
    },
    'Rainbow Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 4 },
        { name: 'Dragon Blood', amount: 3 },
        { name: 'Phoenix Feather', amount: 3 },
        { name: 'Unicorn Hair', amount: 2 },
        { name: 'Rose Petals', amount: 2 }
      ],
      result: {
        name: 'Rainbow Potion',
        type: 'potion',
        price: 70,
        description: 'Creates rainbow effects.',
        effect: 'rainbow',
        duration: 3000000 // 50 minutes
      }
    }
  },
  4: {
    'Glow Potion': {
      ingredients: [
        { name: 'Phoenix Feather', amount: 4 },
        { name: 'Dragon Blood', amount: 3 },
        { name: 'Unicorn Hair', amount: 4 },
        { name: 'Rose Petals', amount: 3 },
        { name: 'Moonstone Dust', amount: 2 }
      ],
      result: {
        name: 'Glow Potion',
        type: 'potion',
        price: 80,
        description: 'Makes you glow.',
        effect: 'glow',
        duration: 3600000 // 60 minutes
      }
    },
    'Hair Color Potion': {
      ingredients: [
        { name: 'Rose Petals', amount: 5 },
        { name: 'Moonstone Dust', amount: 4 },
        { name: 'Dragon Blood', amount: 2 },
        { name: 'Phoenix Feather', amount: 4 },
        { name: 'Unicorn Hair', amount: 3 }
      ],
      result: {
        name: 'Hair Color Potion',
        type: 'potion',
        price: 90,
        description: 'Changes your hair color.',
        effect: 'hairColor',
        duration: 7200000 // 2 hours
      }
    },
    'Lucky Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 5 },
        { name: 'Dragon Blood', amount: 4 },
        { name: 'Phoenix Feather', amount: 5 },
        { name: 'Unicorn Hair', amount: 4 },
        { name: 'Rose Petals', amount: 3 }
      ],
      result: {
        name: 'Lucky Potion',
        type: 'potion',
        price: 100,
        description: 'Increases your luck.',
        effect: 'lucky',
        duration: 10800000 // 3 hours
      }
    }
  },
  5: {
    'Invisibility Potion': {
      ingredients: [
        { name: 'Phoenix Feather', amount: 5 },
        { name: 'Dragon Blood', amount: 5 },
        { name: 'Unicorn Hair', amount: 5 },
        { name: 'Rose Petals', amount: 4 },
        { name: 'Moonstone Dust', amount: 3 }
      ],
      result: {
        name: 'Invisibility Potion',
        type: 'potion',
        price: 120,
        description: 'Makes you invisible.',
        effect: 'invisibility',
        duration: 1800000 // 30 minutes
      }
    },
    'Death Draught': {
      ingredients: [
        { name: 'Dragon Blood', amount: 6 },
        { name: 'Phoenix Feather', amount: 6 },
        { name: 'Unicorn Hair', amount: 6 },
        { name: 'Rose Petals', amount: 5 },
        { name: 'Moonstone Dust', amount: 4 }
      ],
      result: {
        name: 'Death Draught',
        type: 'potion',
        price: 150,
        description: 'A dangerous potion with dark effects.',
        effect: 'deathDraught',
        duration: 900000 // 15 minutes
      }
    },
    'Retro Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 6 },
        { name: 'Dragon Blood', amount: 5 },
        { name: 'Phoenix Feather', amount: 5 },
        { name: 'Unicorn Hair', amount: 5 },
        { name: 'Rose Petals', amount: 5 }
      ],
      result: {
        name: 'Retro Potion',
        type: 'potion',
        price: 110,
        description: 'Gives a retro aesthetic.',
        effect: 'retro',
        duration: 5400000 // 90 minutes
      }
    }
  },
  6: {
    'Healing Potion': {
      ingredients: [
        { name: 'Rose Petals', amount: 6 },
        { name: 'Moonstone Dust', amount: 5 },
        { name: 'Dragon Blood', amount: 6 },
        { name: 'Phoenix Feather', amount: 6 },
        { name: 'Unicorn Hair', amount: 5 }
      ],
      result: {
        name: 'Healing Potion',
        type: 'potion',
        price: 80,
        description: 'Restores health when consumed.',
        effect: 'healing',
        duration: 0 // Instant effect
      }
    },
    'Love Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 7 },
        { name: 'Dragon Blood', amount: 6 },
        { name: 'Phoenix Feather', amount: 7 },
        { name: 'Unicorn Hair', amount: 6 },
        { name: 'Rose Petals', amount: 6 }
      ],
      result: {
        name: 'Love Potion',
        type: 'potion',
        price: 130,
        description: 'Creates love effects.',
        effect: 'love',
        duration: 7200000 // 2 hours
      }
    },
    'Whisper Potion': {
      ingredients: [
        { name: 'Phoenix Feather', amount: 7 },
        { name: 'Dragon Blood', amount: 7 },
        { name: 'Unicorn Hair', amount: 7 },
        { name: 'Rose Petals', amount: 6 },
        { name: 'Moonstone Dust', amount: 5 }
      ],
      result: {
        name: 'Whisper Potion',
        type: 'potion',
        price: 140,
        description: 'Makes your voice whisper.',
        effect: 'whisper',
        duration: 3600000 // 60 minutes
      }
    },
    'Dark Mode Potion': {
      ingredients: [
        { name: 'Dragon Blood', amount: 8 },
        { name: 'Phoenix Feather', amount: 8 },
        { name: 'Unicorn Hair', amount: 8 },
        { name: 'Rose Petals', amount: 7 },
        { name: 'Moonstone Dust', amount: 6 }
      ],
      result: {
        name: 'Dark Mode Potion',
        type: 'potion',
        price: 160,
        description: 'Activates dark mode.',
        effect: 'darkMode',
        duration: 14400000 // 4 hours
      }
    }
  },
  7: {
    // 7th year has access to ALL potions
    'Slow Motion Potion': {
      ingredients: [
        { name: 'Rose Petals', amount: 2 },
        { name: 'Moonstone Dust', amount: 1 },
        { name: 'Dragon Blood', amount: 1 },
        { name: 'Phoenix Feather', amount: 1 },
        { name: 'Unicorn Hair', amount: 1 }
      ],
      result: {
        name: 'Slow Motion Potion',
        type: 'potion',
        price: 30,
        description: 'Makes everything appear to move in slow motion.',
        effect: 'slowMotion',
        duration: 300000 // 5 minutes
      }
    },
    'Shout Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 2 },
        { name: 'Dragon Blood', amount: 1 },
        { name: 'Phoenix Feather', amount: 2 },
        { name: 'Unicorn Hair', amount: 1 },
        { name: 'Rose Petals', amount: 1 }
      ],
      result: {
        name: 'Shout Potion',
        type: 'potion',
        price: 25,
        description: 'Makes your voice much louder.',
        effect: 'shout',
        duration: 600000 // 10 minutes
      }
    },
    'Echo Potion': {
      ingredients: [
        { name: 'Phoenix Feather', amount: 2 },
        { name: 'Dragon Blood', amount: 1 },
        { name: 'Unicorn Hair', amount: 2 },
        { name: 'Rose Petals', amount: 1 },
        { name: 'Moonstone Dust', amount: 1 }
      ],
      result: {
        name: 'Echo Potion',
        type: 'potion',
        price: 35,
        description: 'Creates echo effects with your voice.',
        effect: 'echo',
        duration: 900000 // 15 minutes
      }
    },
    'Translation Potion': {
      ingredients: [
        { name: 'Rose Petals', amount: 3 },
        { name: 'Moonstone Dust', amount: 2 },
        { name: 'Dragon Blood', amount: 1 },
        { name: 'Phoenix Feather', amount: 1 },
        { name: 'Unicorn Hair', amount: 2 }
      ],
      result: {
        name: 'Translation Potion',
        type: 'potion',
        price: 50,
        description: 'Translates text to different languages.',
        effect: 'translation',
        duration: 1800000 // 30 minutes
      }
    },
    'Speed Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 3 },
        { name: 'Dragon Blood', amount: 2 },
        { name: 'Phoenix Feather', amount: 1 },
        { name: 'Unicorn Hair', amount: 1 },
        { name: 'Rose Petals', amount: 2 }
      ],
      result: {
        name: 'Speed Potion',
        type: 'potion',
        price: 45,
        description: 'Makes you move faster.',
        effect: 'speed',
        duration: 1200000 // 20 minutes
      }
    },
    'Mirror Potion': {
      ingredients: [
        { name: 'Phoenix Feather', amount: 3 },
        { name: 'Dragon Blood', amount: 1 },
        { name: 'Unicorn Hair', amount: 3 },
        { name: 'Rose Petals', amount: 1 },
        { name: 'Moonstone Dust', amount: 2 }
      ],
      result: {
        name: 'Mirror Potion',
        type: 'potion',
        price: 40,
        description: 'Creates mirror effects.',
        effect: 'mirror',
        duration: 1500000 // 25 minutes
      }
    },
    'Sparkle Potion': {
      ingredients: [
        { name: 'Rose Petals', amount: 4 },
        { name: 'Moonstone Dust', amount: 3 },
        { name: 'Dragon Blood', amount: 2 },
        { name: 'Phoenix Feather', amount: 2 },
        { name: 'Unicorn Hair', amount: 1 }
      ],
      result: {
        name: 'Sparkle Potion',
        type: 'potion',
        price: 60,
        description: 'Makes everything sparkle.',
        effect: 'sparkle',
        duration: 2400000 // 40 minutes
      }
    },
    'Rainbow Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 4 },
        { name: 'Dragon Blood', amount: 3 },
        { name: 'Phoenix Feather', amount: 3 },
        { name: 'Unicorn Hair', amount: 2 },
        { name: 'Rose Petals', amount: 2 }
      ],
      result: {
        name: 'Rainbow Potion',
        type: 'potion',
        price: 70,
        description: 'Creates rainbow effects.',
        effect: 'rainbow',
        duration: 3000000 // 50 minutes
      }
    },
    'Glow Potion': {
      ingredients: [
        { name: 'Phoenix Feather', amount: 4 },
        { name: 'Dragon Blood', amount: 3 },
        { name: 'Unicorn Hair', amount: 4 },
        { name: 'Rose Petals', amount: 3 },
        { name: 'Moonstone Dust', amount: 2 }
      ],
      result: {
        name: 'Glow Potion',
        type: 'potion',
        price: 80,
        description: 'Makes you glow.',
        effect: 'glow',
        duration: 3600000 // 60 minutes
      }
    },
    'Hair Color Potion': {
      ingredients: [
        { name: 'Rose Petals', amount: 5 },
        { name: 'Moonstone Dust', amount: 4 },
        { name: 'Dragon Blood', amount: 2 },
        { name: 'Phoenix Feather', amount: 4 },
        { name: 'Unicorn Hair', amount: 3 }
      ],
      result: {
        name: 'Hair Color Potion',
        type: 'potion',
        price: 90,
        description: 'Changes your hair color.',
        effect: 'hairColor',
        duration: 7200000 // 2 hours
      }
    },
    'Lucky Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 5 },
        { name: 'Dragon Blood', amount: 4 },
        { name: 'Phoenix Feather', amount: 5 },
        { name: 'Unicorn Hair', amount: 4 },
        { name: 'Rose Petals', amount: 3 }
      ],
      result: {
        name: 'Lucky Potion',
        type: 'potion',
        price: 100,
        description: 'Increases your luck.',
        effect: 'lucky',
        duration: 10800000 // 3 hours
      }
    },
    'Invisibility Potion': {
      ingredients: [
        { name: 'Phoenix Feather', amount: 5 },
        { name: 'Dragon Blood', amount: 5 },
        { name: 'Unicorn Hair', amount: 5 },
        { name: 'Rose Petals', amount: 4 },
        { name: 'Moonstone Dust', amount: 3 }
      ],
      result: {
        name: 'Invisibility Potion',
        type: 'potion',
        price: 120,
        description: 'Makes you invisible.',
        effect: 'invisibility',
        duration: 1800000 // 30 minutes
      }
    },
    'Death Draught': {
      ingredients: [
        { name: 'Dragon Blood', amount: 6 },
        { name: 'Phoenix Feather', amount: 6 },
        { name: 'Unicorn Hair', amount: 6 },
        { name: 'Rose Petals', amount: 5 },
        { name: 'Moonstone Dust', amount: 4 }
      ],
      result: {
        name: 'Death Draught',
        type: 'potion',
        price: 150,
        description: 'A dangerous potion with dark effects.',
        effect: 'deathDraught',
        duration: 900000 // 15 minutes
      }
    },
    'Retro Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 6 },
        { name: 'Dragon Blood', amount: 5 },
        { name: 'Phoenix Feather', amount: 5 },
        { name: 'Unicorn Hair', amount: 5 },
        { name: 'Rose Petals', amount: 5 }
      ],
      result: {
        name: 'Retro Potion',
        type: 'potion',
        price: 110,
        description: 'Gives a retro aesthetic.',
        effect: 'retro',
        duration: 5400000 // 90 minutes
      }
    },
    'Healing Potion': {
      ingredients: [
        { name: 'Rose Petals', amount: 6 },
        { name: 'Moonstone Dust', amount: 5 },
        { name: 'Dragon Blood', amount: 6 },
        { name: 'Phoenix Feather', amount: 6 },
        { name: 'Unicorn Hair', amount: 5 }
      ],
      result: {
        name: 'Healing Potion',
        type: 'potion',
        price: 80,
        description: 'Restores health when consumed.',
        effect: 'healing',
        duration: 0 // Instant effect
      }
    },
    'Love Potion': {
      ingredients: [
        { name: 'Moonstone Dust', amount: 7 },
        { name: 'Dragon Blood', amount: 6 },
        { name: 'Phoenix Feather', amount: 7 },
        { name: 'Unicorn Hair', amount: 6 },
        { name: 'Rose Petals', amount: 6 }
      ],
      result: {
        name: 'Love Potion',
        type: 'potion',
        price: 130,
        description: 'Creates love effects.',
        effect: 'love',
        duration: 7200000 // 2 hours
      }
    },
    'Whisper Potion': {
      ingredients: [
        { name: 'Phoenix Feather', amount: 7 },
        { name: 'Dragon Blood', amount: 7 },
        { name: 'Unicorn Hair', amount: 7 },
        { name: 'Rose Petals', amount: 6 },
        { name: 'Moonstone Dust', amount: 5 }
      ],
      result: {
        name: 'Whisper Potion',
        type: 'potion',
        price: 140,
        description: 'Makes your voice whisper.',
        effect: 'whisper',
        duration: 3600000 // 60 minutes
      }
    },
    'Dark Mode Potion': {
      ingredients: [
        { name: 'Dragon Blood', amount: 8 },
        { name: 'Phoenix Feather', amount: 8 },
        { name: 'Unicorn Hair', amount: 8 },
        { name: 'Rose Petals', amount: 7 },
        { name: 'Moonstone Dust', amount: 6 }
      ],
      result: {
        name: 'Dark Mode Potion',
        type: 'potion',
        price: 160,
        description: 'Activates dark mode.',
        effect: 'darkMode',
        duration: 14400000 // 4 hours
      }
    }
  }
};

const PotionCrafting = ({ userYear = 1 }) => {
  // Handle graduate status - graduates have access to all recipes
  const effectiveYear = userYear === 'graduate' ? 7 : userYear;
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [userIngredients, setUserIngredients] = useState({});
  const [hasCauldron, setHasCauldron] = useState(false);
  const [craftingResult, setCraftingResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [craftedPotions, setCraftedPotions] = useState(new Set());
  const [openRecipes, setOpenRecipes] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 3;

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
        const crafted = new Set();
        inventory.forEach(item => {
          if (item.type === 'ingredient') {
            ingredients[item.name] = (ingredients[item.name] || 0) + (item.qty || 1);
          }
          if (item.crafted && item.type === 'potion') {
            crafted.add(item.name);
          }
        });
        setUserIngredients(ingredients);
        setCraftedPotions(crafted);
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

  const toggleRecipe = (recipeName) => {
    setOpenRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeName)) {
        newSet.delete(recipeName);
      } else {
        newSet.add(recipeName);
      }
      return newSet;
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
        existingPotion.crafted = true;
        existingPotion.craftedAt = Date.now();
      } else {
        inventory.push({
          ...recipe.result,
          qty: 1,
          crafted: true,
          craftedAt: Date.now()
        });
      }
      
      // Add to crafted potions set
      setCraftedPotions(prev => new Set([...prev, recipe.result.name]));
      
      // Update crafted potions array in Firestore
      const currentCraftedPotions = data.craftedPotions || [];
      const updatedCraftedPotions = [...new Set([...currentCraftedPotions, recipe.result.name])];
      
      await updateDoc(userRef, { 
        inventory,
        craftedPotions: updatedCraftedPotions
      });
      
      // Clear cache to refresh Shop component
      const { cacheHelpers } = await import('../../utils/firebaseCache');
      cacheHelpers.clearUserCache(user.uid);
      
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
        <h4>Available Recipes (Years 1-{userYear === 'graduate' ? '7 (Graduate)' : userYear}):</h4>
        {(() => {
          // Get all recipes for years 1 through userYear (cumulative)
          const allRecipes = [];
          for (let year = 1; year <= effectiveYear; year++) {
            const yearRecipes = Object.entries(POTION_RECIPES_BY_YEAR[year] || {});
            allRecipes.push(...yearRecipes.map(([name, recipe]) => ({ name, recipe, year })));
          }
          
          const totalPages = Math.ceil(allRecipes.length / recipesPerPage);
          const startIndex = (currentPage - 1) * recipesPerPage;
          const endIndex = startIndex + recipesPerPage;
          const currentRecipes = allRecipes.slice(startIndex, endIndex);

          return (
            <>
              {currentRecipes.map(({ name, recipe, year }) => {
                const isOpen = openRecipes.has(name);
                return (
                  <div key={name} className={styles.recipe}>
                    <div 
                      className={styles.recipeHeader}
                      onClick={() => toggleRecipe(name)}
                    >
                      <h5>{name} <span className={styles.yearBadge}>(Year {year})</span></h5>
                      <span className={`${styles.dropdownArrow} ${isOpen ? styles.open : ''}`}>
                        ▼
                      </span>
                    </div>
                    <div className={`${styles.recipeContent} ${isOpen ? styles.open : ''}`}>
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
                  </div>
                );
              })}
              
              {/* Pagination for 7th year and graduates */}
              {(effectiveYear === 7 || userYear === 'graduate') && totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                  >
                    ← Previous
                  </button>
                  
                  <div className={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                    <span className={styles.recipeCount}>
                      ({allRecipes.length} recipes total)
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={styles.paginationButton}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default PotionCrafting;
