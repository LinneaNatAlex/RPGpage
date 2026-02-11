import React, { useState, useEffect, useRef } from "react";
import styles from "./BookViewer.module.css";

const BookViewer = ({ open, book, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showImageModal, setShowImageModal] = useState(false);
  const audioRef = useRef(null);

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

  // Handle audio setup when page changes
  useEffect(() => {
    const currentPageData = book?.pages?.[currentPage];
    if (audioRef.current && currentPageData?.audioUrl) {
      // Set up audio element
      audioRef.current.volume = volume;
      // Stop any playing audio when changing pages
      setIsPlaying(false);
    } else {
      setIsPlaying(false);
    }
  }, [currentPage, book, volume]);

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

  // Audio control functions
  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Image modal functions
  const openImageModal = () => {
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const nextPage = () => {
    if (currentPage < book.pages.length - 1) {
      stopAudio(); // Stop current audio when changing page
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      stopAudio(); // Stop current audio when changing page
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
                onClick={openImageModal}
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

          {/* Audio Player for current page */}
          {currentPageData.audioUrl && (
            <div className={styles.audioPlayer}>
              <audio
                ref={audioRef}
                src={currentPageData.audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />

              <div className={styles.audioControls}>
                <button
                  onClick={isPlaying ? pauseAudio : playAudio}
                  className={styles.audioBtn}
                >
                  {isPlaying ? (
                    <div className={styles.pauseIcon}></div>
                  ) : (
                    <div className={styles.playIcon}></div>
                  )}
                </button>

                <button onClick={stopAudio} className={styles.audioBtn}>
                  <div className={styles.stopIcon}></div>
                </button>

                <div className={styles.volumeControl}>
                  <div className={styles.volumeIcon}></div>
                  <input
                    id="book-viewer-volume"
                    name="volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className={styles.volumeSlider}
                  />
                </div>
              </div>
            </div>
          )}
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

      {/* Image Modal */}
      {showImageModal && book.coverImage && (
        <div className={styles.imageModal} onClick={closeImageModal}>
          <img
            src={book.coverImage}
            alt={`${book.title} cover full size`}
            className={styles.imageModalContent}
            onClick={(e) => e.stopPropagation()}
          />
          <button className={styles.imageModalClose} onClick={closeImageModal}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default BookViewer;
