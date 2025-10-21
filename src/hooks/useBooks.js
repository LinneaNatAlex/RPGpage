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
      console.error("Error fetching books: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new book
  const addBook = async (bookData) => {
    try {
      console.log("Adding book to Firestore:", bookData);
      const docRef = await addDoc(collection(db, "books"), {
        ...bookData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("Book added successfully with ID:", docRef.id);

      // Refetch books to update the list
      await fetchBooks();

      return docRef.id;
    } catch (error) {
      console.error("Error adding book: ", error);
      console.error("Error details:", error.code, error.message);
      throw error;
    }
  };

  // Update an existing book
  const updateBook = async (bookId, bookData) => {
    try {
      console.log("updateBook called with:", bookId, bookData);
      alert("updateBook function called!"); // Temporary test
      
      const bookRef = doc(db, "books", bookId);
      await updateDoc(bookRef, {
        ...bookData,
        updatedAt: serverTimestamp(),
      });

      console.log("Book updated in Firestore, now updating inventories...");

      // Update all copies of this book in users' inventories
      await updateBookInAllInventories(bookId, bookData);

      console.log("Inventory updates completed, refetching books...");

      // Refetch books to update the list
      await fetchBooks();
      
      console.log("Book update process completed");
    } catch (error) {
      console.error("Error updating book: ", error);
      throw error;
    }
  };

  // Update book in all users' inventories
  const updateBookInAllInventories = async (bookId, bookData) => {
    try {
      console.log("Updating book in all inventories:", bookId, bookData);
      
      // Get all users
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
            // Check if this is the book we're looking for
            const isTargetBook = item.bookId === bookId || 
                                (item.type === "book" && item.id === bookId) ||
                                (item.type === "book" && item.name === bookData.title);
            
            if (isTargetBook) {
              console.log("Found book in user inventory:", userDoc.id, item);
              usersWithBook++;
              
              // Update the book data while preserving user-specific data like purchase date
              return {
                ...item,
                ...bookData,
                // Preserve user-specific fields
                purchaseDate: item.purchaseDate,
                purchasedFrom: item.purchasedFrom,
                // Update book-specific fields
                title: bookData.title,
                description: bookData.description,
                price: bookData.price,
                pages: bookData.pages,
                coverImage: bookData.coverImage,
                audioUrl: bookData.audioUrl,
                author: bookData.author,
                updatedAt: new Date().toISOString()
              };
            }
            return item;
          });
          
          // Only update if inventory actually changed
          const hasChanges = JSON.stringify(updatedInventory) !== JSON.stringify(userData.inventory);
          if (hasChanges) {
            console.log("Updating inventory for user:", userDoc.id);
            updatePromises.push(
              updateDoc(doc(db, "users", userDoc.id), {
                inventory: updatedInventory
              })
            );
          }
        }
      });
      
      console.log(`Found book in ${usersWithBook} out of ${totalUsers} users`);
      
      // Execute all updates in parallel
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`Updated ${updatePromises.length} user inventories`);
      } else {
        console.log("No user inventories needed updating");
      }
    } catch (error) {
      console.error("Error updating book in inventories: ", error);
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
      console.error("Error deleting book: ", error);
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
      console.error("Error removing book from inventories: ", error);
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
