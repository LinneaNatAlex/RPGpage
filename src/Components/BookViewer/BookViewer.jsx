import React, { useState, useEffect } from "react";
import styles from "./BookViewer.module.css";

const BookViewer = ({ open, book, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Don't render if not open
  if (!open) {
    return null;
  }

  if (!book) {
    return (
      <div className={styles.bookViewer}>
        <div className={styles.bookContent}>
          <h2>No Book Selected</h2>
          <p>Please select a book to read.</p>
          <button onClick={onClose} className={styles.closeBtn}>
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!book.pages || book.pages.length === 0) {
    return (
      <div className={styles.bookViewer}>
        <div className={styles.bookContent}>
          <h2>No Content Available</h2>
          <p>This book has no pages to display.</p>
          <p>Book data: {JSON.stringify(book, null, 2)}</p>
          <button onClick={onClose} className={styles.closeBtn}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const nextPage = () => {
    if (currentPage < book.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentPageData = book.pages[currentPage];

  return (
    <div className={styles.bookViewer} onClick={onClose}>
      <div className={styles.bookContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.bookHeader}>
          <h2>{book.title}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            ×
          </button>
        </div>

        <div className={styles.bookInfo}>
          {/* Book Cover Image */}
          {book.coverImage && (
            <div className={styles.bookCoverContainer}>
              <img
                src={book.coverImage}
                alt={`${book.title} cover`}
                className={styles.bookCover}
              />
            </div>
          )}
          <p>
            <strong>Author:</strong> {book.author}
          </p>
          {book.description && (
            <p>
              <strong>Description:</strong> {book.description}
            </p>
          )}
        </div>

        <div className={styles.pageContent}>
          <div className={styles.pageHeader}>
            <span>
              Page {currentPage + 1} of {book.pages.length}
            </span>
          </div>

          <div className={styles.pageText}>
            <div
              dangerouslySetInnerHTML={{ __html: currentPageData.content }}
            />
          </div>
        </div>

        <div className={styles.pageNavigation}>
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className={styles.navBtn}
          >
            ← Previous
          </button>

          <span className={styles.pageIndicator}>
            {currentPage + 1} / {book.pages.length}
          </span>

          <button
            onClick={nextPage}
            disabled={currentPage === book.pages.length - 1}
            className={styles.navBtn}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookViewer;
