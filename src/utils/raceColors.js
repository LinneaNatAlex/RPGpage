// Utility function to get race-based colors for user names
export const getRaceColor = (race) => {
  if (!race) {
    return '#FFFFFF'; // Default white color for unknown race
  }

  const raceLower = race.toLowerCase();

  // Werewolf - Night blue
  if (raceLower.includes('werewolf') || raceLower.includes('varulv')) {
    return '#1e3a8a'; // Night blue
  }
  
  // Vampire - Blood red
  if (raceLower.includes('vampire') || raceLower.includes('vampyr')) {
    return '#dc2626'; // Blood red
  }
  
  // Wizard - Dark green
  if (raceLower.includes('wizard') || raceLower.includes('trollmann')) {
    return '#166534'; // Dark green
  }
  
  // Elf - Turquoise/Neon
  if (raceLower.includes('elf') || raceLower.includes('alv')) {
    return '#06b6d4'; // Turquoise/Neon
  }
  
  // Witch - Purple
  if (raceLower.includes('witch') || raceLower.includes('heks')) {
    return '#7c3aed'; // Purple
  }
  
  // Human - Gold
  if (raceLower.includes('human') || raceLower.includes('menneske')) {
    return '#d97706'; // Gold
  }

  // Default color for unknown races
  return '#FFFFFF'; // White for unknown races
};

// Function to get race display name
export const getRaceDisplayName = (race) => {
  if (!race) {
    return '';
  }

  const raceLower = race.toLowerCase();

  if (raceLower.includes('werewolf') || raceLower.includes('varulv')) {
    return 'Werewolf';
  }
  
  if (raceLower.includes('vampire') || raceLower.includes('vampyr')) {
    return 'Vampire';
  }
  
  if (raceLower.includes('wizard') || raceLower.includes('trollmann')) {
    return 'Wizard';
  }
  
  if (raceLower.includes('elf') || raceLower.includes('alv')) {
    return 'Elf';
  }
  
  if (raceLower.includes('witch') || raceLower.includes('heks')) {
    return 'Witch';
  }
  
  if (raceLower.includes('human') || raceLower.includes('menneske')) {
    return 'Human';
  }

  return race; // Return original race name if not recognized
};
