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
      const bookRef = doc(db, "books", bookId);
      await updateDoc(bookRef, {
        ...bookData,
        updatedAt: serverTimestamp(),
      });

      // Refetch books to update the list
      await fetchBooks();
    } catch (error) {
      console.error("Error updating book: ", error);
      throw error;
    }
  };

  // Delete a book
  const deleteBook = async (bookId) => {
    try {
      const bookRef = doc(db, "books", bookId);
      await deleteDoc(bookRef);

      // Refetch books to update the list
      await fetchBooks();
    } catch (error) {
      console.error("Error deleting book: ", error);
      throw error;
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
