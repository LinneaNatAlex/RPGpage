import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useAuth } from "../../context/authContext";
import useBooks from "../../hooks/useBooks";
import { useImageUpload } from "../../hooks/useImageUpload";
import styles from "./BookEditor.module.css";

const BookEditor = ({ book = null, onSave, onCancel }) => {
  const { user } = useAuth();
  const { addBook, updateBook } = useBooks();
  const { uploadImage } = useImageUpload();

  const [title, setTitle] = useState(book?.title || "");
  const [description, setDescription] = useState(book?.description || "");
  const [price, setPrice] = useState(book?.price || 0);
  const [pages, setPages] = useState(
    book?.pages || [{ content: "", pageNumber: 1, htmlMode: false }]
  );
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState(book?.coverImage || "");
  const [uploadingImage, setUploadingImage] = useState(false);

  const addPage = () => {
    setPages([
      ...pages,
      { content: "", pageNumber: pages.length + 1, htmlMode: false },
    ]);
  };

  const removePage = (index) => {
    if (pages.length > 1) {
      const newPages = pages.filter((_, i) => i !== index);
      // Re-number pages
      const renumberedPages = newPages.map((page, i) => ({
        ...page,
        pageNumber: i + 1,
      }));
      setPages(renumberedPages);
    }
  };

  const updatePage = (index, content) => {
    const newPages = [...pages];
    newPages[index].content = content;
    setPages(newPages);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Bildet er for stort. Maksimal størrelse er 2MB.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Vennligst velg et gyldig bildeformat.");
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        setCoverImage(imageUrl);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Kunne ikke laste opp bilde. Prøv igjen.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setCoverImage("");
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a book title");
      return;
    }

    if (!user) {
      alert("You must be logged in to save a book");
      return;
    }

    setSaving(true);
    try {
      const bookData = {
        title: title.trim(),
        description: description.trim(),
        price: parseInt(price) || 0,
        pages: pages.filter((page) => page.content.trim()),
        author: user.displayName || user.email,
        authorId: user.uid,
        type: "book",
        coverImage: coverImage,
      };

      console.log("Saving book data:", bookData);

      if (book) {
        await updateBook(book.id, bookData);
      } else {
        await addBook(bookData);
      }

      onSave?.();
    } catch (error) {
      console.error("Error saving book:", error);
      alert(`Error saving book: ${error.message || "Please try again."}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.bookEditor}>
      <h2>{book ? "Edit Book" : "Create New Book"}</h2>

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

      <div className={styles.formGroup}>
        <label>Book Cover Image:</label>
        <div className={styles.imageUploadSection}>
          {coverImage ? (
            <div className={styles.imagePreview}>
              <img
                src={coverImage}
                alt="Book cover preview"
                className={styles.coverImage}
              />
              <button
                type="button"
                onClick={removeImage}
                className={styles.removeImageBtn}
              >
                Remove Image
              </button>
            </div>
          ) : (
            <div className={styles.imageUploadArea}>
              <label className={styles.uploadLabel}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                  style={{ display: "none" }}
                />
                <span className={styles.uploadButton}>
                  {uploadingImage ? "Uploading..." : "Choose Cover Image"}
                </span>
              </label>
              <p className={styles.uploadHint}>
                Max size: 2MB. Recommended: 300x400px
              </p>
            </div>
          )}
        </div>
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
              <button
                className={styles.toggleHtmlBtn}
                onClick={() => {
                  const newPages = [...pages];
                  newPages[index].htmlMode = !newPages[index].htmlMode;
                  setPages(newPages);
                }}
                style={{ marginLeft: 12 }}
              >
                {page.htmlMode ? "WYSIWYG-modus" : "HTML/CSS-modus"}
              </button>
            </div>
            {page.htmlMode ? (
              <>
                <textarea
                  value={page.content}
                  onChange={(e) => updatePage(index, e.target.value)}
                  placeholder="Skriv HTML/CSS..."
                  className={styles.pageContent}
                  rows={8}
                  style={{ fontFamily: "monospace" }}
                />
                <div
                  className={styles.htmlPreviewLabel}
                  style={{ marginTop: 8, fontWeight: "bold" }}
                >
                  Preview:
                </div>
                <div
                  className={styles.htmlPreview}
                  style={{
                    border: "1px solid #ccc",
                    padding: 8,
                    marginBottom: 8,
                    background: "#fff",
                  }}
                >
                  <iframe
                    title={`Preview-${index}`}
                    style={{ width: "100%", minHeight: 120, border: "none", color: " #e19924" }}
                    sandbox="allow-scripts allow-same-origin"
                    srcDoc={page.content}
                  />
                </div>
              </>
            ) : (
              <ReactQuill
                value={page.content}
                onChange={(content) => updatePage(index, content)}
                theme="snow"
                modules={{
                  toolbar: [
                    [{ font: [] }],
                    [{ header: [1, 2, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
                className={styles.pageContent}
              />
            )}
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
          {saving ? "Saving..." : book ? "Update Book" : "Create Book"}
        </button>
      </div>
    </div>
  );
};

export default BookEditor;
