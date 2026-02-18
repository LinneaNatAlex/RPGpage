import React, { useState, useEffect } from "react";
import ReactQuillWithSynonyms from "../ReactQuillWithSynonyms/ReactQuillWithSynonyms";
import "react-quill/dist/quill.snow.css";
import { useAuth } from "../../context/authContext";
import useBooks from "../../hooks/useBooks";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useAudioUpload } from "../../hooks/useAudioUpload";
import useAllUsers from "../../hooks/useAllUsers";
import styles from "./BookEditor.module.css";

const BookEditor = ({ book = null, onSave, onCancel }) => {
  const { user } = useAuth();
  const { addBook, updateBook } = useBooks();
  const { uploadImage } = useImageUpload();
  const { uploadAudio } = useAudioUpload();
  const { users, loading: usersLoading } = useAllUsers();

  const [title, setTitle] = useState(book?.title || "");
  const [description, setDescription] = useState(book?.description || "");
  const [price, setPrice] = useState(book?.price || 0);
  const [selectedAuthor, setSelectedAuthor] = useState(
    book?.author || user?.displayName || ""
  );
  const [pages, setPages] = useState(
    book?.pages || [
      { content: "", pageNumber: 1, htmlMode: false, audioUrl: "" },
    ]
  );
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState(book?.coverImage || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState({});

  // Set default author when users load and no author is selected yet
  useEffect(() => {
    if (!selectedAuthor && user?.displayName) {
      setSelectedAuthor(user.displayName);
    }
  }, [user, selectedAuthor]);

  const addPage = () => {
    setPages([
      ...pages,
      {
        content: "",
        pageNumber: pages.length + 1,
        htmlMode: false,
        audioUrl: "",
      },
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
      alert("Image is too large. Maximum size is 2MB.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please choose a valid image format.");
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        setCoverImage(imageUrl);
      }
    } catch (error) {
      alert("Could not upload image. Try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setCoverImage("");
  };

  const handleAudioChange = async (e, pageIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validAudioTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp3",
      "audio/m4a",
    ];
    if (!validAudioTypes.includes(file.type)) {
      alert("Please choose a valid audio format (MP3, WAV, OGG, M4A).");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Audio file is too large. Maximum size is 10MB.");
      return;
    }

    setUploadingAudio((prev) => ({ ...prev, [pageIndex]: true }));
    try {
      const audioUrl = await uploadAudio(file);
      if (audioUrl) {
        const newPages = [...pages];
        newPages[pageIndex].audioUrl = audioUrl;
        setPages(newPages);
      }
    } catch (error) {
      alert("Could not upload audio file. Try again.");
    } finally {
      setUploadingAudio((prev) => ({ ...prev, [pageIndex]: false }));
    }
  };

  const removeAudio = (pageIndex) => {
    const newPages = [...pages];
    newPages[pageIndex].audioUrl = "";
    setPages(newPages);
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
        author: selectedAuthor || user.displayName || user.email,
        createdBy: user.uid,
        authorUid: user.uid,
        type: "book",
        coverImage: coverImage,
      };


      if (book) {
        await updateBook(book.id, bookData);
      } else {
        await addBook(bookData);
      }

      onSave?.();
    } catch (error) {
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
          id="book-editor-title"
          name="bookTitle"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter book title"
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Author:</label>
        <input
          id="book-editor-author"
          name="bookAuthor"
          type="text"
          value={selectedAuthor}
          onChange={(e) => setSelectedAuthor(e.target.value)}
          placeholder="Enter author name"
          className={styles.input}
          list="userSuggestions"
        />
        <datalist id="userSuggestions">
          {users.map((userOption) => (
            <option key={userOption.uid} value={userOption.displayName}>
              {userOption.displayName}
            </option>
          ))}
        </datalist>
        <small className={styles.authorHint}>
          You can enter any name - it doesn't have to be an existing user
        </small>
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
          id="book-editor-price"
          name="bookPrice"
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
                  id="book-editor-cover-image"
                  name="coverImage"
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

            {/* Audio Upload Section */}
            <div className={styles.audioUploadSection}>
              <label>Background Audio (Optional):</label>
              {page.audioUrl ? (
                <div className={styles.audioPreview}>
                  <audio controls className={styles.audioPlayer}>
                    <source src={page.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  <button
                    type="button"
                    onClick={() => removeAudio(index)}
                    className={styles.removeAudioBtn}
                  >
                    Remove Audio
                  </button>
                </div>
              ) : (
                <div className={styles.audioUploadArea}>
                  <label className={styles.uploadLabel}>
                    <input
                      id={`book-editor-audio-${index}`}
                      name={`pageAudio-${index}`}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleAudioChange(e, index)}
                      disabled={uploadingAudio[index]}
                      style={{ display: "none" }}
                    />
                    <span className={styles.uploadButton}>
                      {uploadingAudio[index]
                        ? "Uploading..."
                        : "Choose Audio File"}
                    </span>
                  </label>
                  <p className={styles.uploadHint}>
                    Max size: 10MB. Supported formats: MP3, WAV, OGG, M4A
                  </p>
                </div>
              )}
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
                    style={{
                      width: "100%",
                      minHeight: 120,
                      border: "none",
                      color: " #e19924",
                    }}
                    sandbox="allow-scripts allow-same-origin"
                    srcDoc={page.content}
                  />
                </div>
              </>
            ) : (
              <ReactQuillWithSynonyms
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
                enableSynonyms={true}
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
