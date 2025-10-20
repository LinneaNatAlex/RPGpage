// Import shop items to match against
import shopItems from "../Components/Shop/itemsList";

// Default images for different item types
export const getItemImage = (item, firestoreItems = []) => {
  // If item already has an image, use it
  if (item.image || item.coverImage) {
    return item.image || item.coverImage;
  }

  // Try to find matching item in firestoreItems first (they might have images)
  const firestoreMatch = firestoreItems.find(
    (fsItem) =>
      fsItem.name === item.name ||
      fsItem.id === item.id ||
      (fsItem.originalId && fsItem.originalId === item.id)
  );

  if (firestoreMatch && (firestoreMatch.image || firestoreMatch.coverImage)) {
    return firestoreMatch.image || firestoreMatch.coverImage;
  }

  // Try to find matching item in static shopItems
  const staticMatch = shopItems.find(
    (shopItem) => shopItem.name === item.name || shopItem.id === item.id
  );

  if (staticMatch && (staticMatch.image || staticMatch.coverImage)) {
    return staticMatch.image || staticMatch.coverImage;
  }

  // Default fallback icon
  return "/icons/chest.svg";
};

// Add image property to items that don't have one
export const addImageToItem = (item, firestoreItems = []) => {
  const image = getItemImage(item, firestoreItems);
  return {
    ...item,
    image: image,
  };
};
