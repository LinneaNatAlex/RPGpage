// Import necessary libraries and hooks
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

const useBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all books from Firestore
  const fetchBooks = async () => {
    try {
      const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const booksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBooks(booksData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Add a new book
  const addBook = async (bookData) => {
    try {
      const docRef = await addDoc(collection(db, "books"), {
        ...bookData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Refetch books to update the list
      await fetchBooks();

      return docRef.id;
    } catch (error) {
      throw error;
    }
  };

  // Update an existing book
  const updateBook = async (bookId, bookData) => {
    try {
      const bookRef = doc(db, "books", bookId);
      await updateDoc(bookRef, {
        ...bookData,
        updatedAt: serverTimestamp(),
      });

      // Update all copies of this book in users' inventories
      await updateBookInAllInventories(bookId, bookData);

      // Refetch books to update the list
      await fetchBooks();
    } catch (error) {
      throw error;
    }
  };

  // Update book in all users' inventories
  const updateBookInAllInventories = async (bookId, bookData) => {
    try {
      
      // Get all users (alert removed)
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      const updatePromises = [];
      let totalUsers = 0;
      let usersWithBook = 0;
      
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        totalUsers++;
        
        if (userData.inventory && Array.isArray(userData.inventory)) {
          // Find all instances of this book in the user's inventory
          const updatedInventory = userData.inventory.map(item => {
            // Check if this is the book we're looking for - be more flexible with matching
            const isTargetBook = item.bookId === bookId || 
                                (item.type === "book" && item.id === bookId) ||
                                (item.type === "book" && item.name === bookData.title) ||
                                (item.type === "book" && item.title === bookData.title);
            
            if (isTargetBook) {
              usersWithBook++;
              
              // Update the book data while preserving user-specific data like purchase date
              // Filter out undefined values to prevent Firestore errors
              const cleanBookData = Object.fromEntries(
                Object.entries(bookData).filter(([key, value]) => value !== undefined)
              );
              
              
              const updatedItem = {
                ...item,
                ...cleanBookData,
                // Preserve user-specific fields
                purchaseDate: item.purchaseDate,
                purchasedFrom: item.purchasedFrom,
                qty: item.qty, // Preserve quantity
                // Update book-specific fields (only if they exist)
                ...(bookData.title && { title: bookData.title }),
                ...(bookData.description && { description: bookData.description }),
                ...(bookData.price !== undefined && { price: bookData.price }),
                ...(bookData.pages && { pages: bookData.pages }),
                ...(bookData.coverImage && { coverImage: bookData.coverImage }),
                ...(bookData.audioUrl && { audioUrl: bookData.audioUrl }),
                ...(bookData.author && { author: bookData.author }),
                updatedAt: new Date().toISOString()
              };
              
              // Filter out undefined values before returning
              const cleanUpdatedItem = Object.fromEntries(
                Object.entries(updatedItem).filter(([key, value]) => value !== undefined)
              );
              
              return cleanUpdatedItem;
            }
            return item;
          });
          
          // Only update if inventory actually changed
          const hasChanges = JSON.stringify(updatedInventory) !== JSON.stringify(userData.inventory);
          if (hasChanges) {
            updatePromises.push(
              updateDoc(doc(db, "users", userDoc.id), {
                inventory: updatedInventory
              })
            );
          }
        }
      });
      
      // Execute all updates in parallel
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    } catch (error) {
      // Don't throw error here to prevent book update from failing
    }
  };

  // Delete a book
  const deleteBook = async (bookId) => {
    try {
      const bookRef = doc(db, "books", bookId);
      await deleteDoc(bookRef);

      // Remove all copies of this book from users' inventories
      await removeBookFromAllInventories(bookId);

      // Refetch books to update the list
      await fetchBooks();
    } catch (error) {
      throw error;
    }
  };

  // Remove book from all users' inventories
  const removeBookFromAllInventories = async (bookId) => {
    try {
      // Get all users
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      const updatePromises = [];
      
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.inventory && Array.isArray(userData.inventory)) {
          // Remove all instances of this book from the user's inventory
          const updatedInventory = userData.inventory.filter(item => 
            !(item.bookId === bookId || (item.type === "book" && item.id === bookId))
          );
          
          // Only update if inventory actually changed
          if (updatedInventory.length !== userData.inventory.length) {
            updatePromises.push(
              updateDoc(doc(db, "users", userDoc.id), {
                inventory: updatedInventory
              })
            );
          }
        }
      });
      
      // Execute all updates in parallel
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    } catch (error) {
      // Don't throw error here to prevent book deletion from failing
    }
  };

  // Fetch books on component mount (no real-time listener to save snapshots)
  useEffect(() => {
    fetchBooks();
  }, []);

  return {
    books,
    loading,
    addBook,
    updateBook,
    deleteBook,
    refetchBooks: fetchBooks,
  };
};

export default useBooks;
