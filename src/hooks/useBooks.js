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
  onSnapshot,
} from "firebase/firestore";

const useBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all books from Firestore
  const fetchBooks = async () => {
    try {
      const snapshot = await getDocs(collection(db, "books"));
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
    } catch (error) {
      console.error("Error deleting book: ", error);
      throw error;
    }
  };

  // Listen to books in real-time
  useEffect(() => {
    const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const booksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBooks(booksData);
        setLoading(false);
      },
      (error) => {
        console.error("Error in books snapshot listener:", error);
        // Fallback to fetchBooks if real-time fails
        fetchBooks();
      }
    );

    return () => unsubscribe();
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
