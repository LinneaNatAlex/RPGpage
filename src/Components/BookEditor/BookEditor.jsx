import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import useBooks from '../../hooks/useBooks';
import styles from './BookEditor.module.css';

const BookEditor = ({ book = null, onSave, onCancel }) => {
  const { user } = useAuth();
  const { addBook, updateBook } = useBooks();
  
  const [title, setTitle] = useState(book?.title || '');
  const [description, setDescription] = useState(book?.description || '');
  const [price, setPrice] = useState(book?.price || 0);
  const [pages, setPages] = useState(book?.pages || [{ content: '', pageNumber: 1 }]);
  const [saving, setSaving] = useState(false);

  const addPage = () => {
    setPages([...pages, { content: '', pageNumber: pages.length + 1 }]);
  };

  const removePage = (index) => {
    if (pages.length > 1) {
      const newPages = pages.filter((_, i) => i !== index);
      // Re-number pages
      const renumberedPages = newPages.map((page, i) => ({
        ...page,
        pageNumber: i + 1
      }));
      setPages(renumberedPages);
    }
  };

  const updatePage = (index, content) => {
    const newPages = [...pages];
    newPages[index].content = content;
    setPages(newPages);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a book title');
      return;
    }

    if (!user) {
      alert('You must be logged in to save a book');
      return;
    }

    setSaving(true);
    try {
      const bookData = {
        title: title.trim(),
        description: description.trim(),
        price: parseInt(price) || 0,
        pages: pages.filter(page => page.content.trim()),
        author: user.displayName || user.email,
        authorId: user.uid,
        type: 'book'
      };

      console.log('Saving book data:', bookData);

      if (book) {
        await updateBook(book.id, bookData);
      } else {
        await addBook(bookData);
      }
      
      onSave?.();
    } catch (error) {
      console.error('Error saving book:', error);
      alert(`Error saving book: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.bookEditor}>
      <h2>{book ? 'Edit Book' : 'Create New Book'}</h2>
      
      <div className={styles.formGroup}>
        <label>Book Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter book title"
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter book description"
          className={styles.textarea}
          rows={3}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Price (points):</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter price in points"
          className={styles.input}
          min="0"
        />
      </div>

      <div className={styles.pagesSection}>
        <div className={styles.pagesHeader}>
          <h3>Book Pages</h3>
          <button onClick={addPage} className={styles.addPageBtn}>
            Add Page
          </button>
        </div>

        {pages.map((page, index) => (
          <div key={index} className={styles.pageEditor}>
            <div className={styles.pageHeader}>
              <h4>Page {page.pageNumber}</h4>
              {pages.length > 1 && (
                <button 
                  onClick={() => removePage(index)}
                  className={styles.removePageBtn}
                >
                  Remove Page
                </button>
              )}
            </div>
            <textarea
              value={page.content}
              onChange={(e) => updatePage(index, e.target.value)}
              placeholder="Enter page content..."
              className={styles.pageContent}
              rows={8}
            />
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          className={styles.saveBtn}
          disabled={saving}
        >
          {saving ? 'Saving...' : (book ? 'Update Book' : 'Create Book')}
        </button>
      </div>
    </div>
  );
};

export default BookEditor;
